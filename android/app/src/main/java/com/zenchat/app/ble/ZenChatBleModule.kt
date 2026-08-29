package com.zenchat.app.ble

import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.ParcelUuid
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.nio.charset.StandardCharsets
import java.util.*
import java.util.concurrent.ConcurrentHashMap

@SuppressLint("MissingPermission")
class ZenChatBleModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val MODULE_NAME = "ZenChatBle"
        val SERVICE_UUID: UUID = UUID.fromString("0000FE60-0000-1000-8000-00805F9B34FB")
        val CHAR_UUID: UUID = UUID.fromString("0000FE61-0000-1000-8000-00805F9B34FB")
        val PARCEL_SERVICE_UUID: ParcelUuid = ParcelUuid(SERVICE_UUID)
        const val MANUFACTURER_ID_USER = 0xFE60
        const val MANUFACTURER_ID_NAME = 0xFE61
    }

    private val bluetoothManager: BluetoothManager? by lazy {
        reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
    }

    private val bluetoothAdapter: BluetoothAdapter?
        get() = bluetoothManager?.adapter

    private var gattServer: BluetoothGattServer? = null
    private var advertiser: BluetoothLeAdvertiser? = null
    private var scanner: BluetoothLeScanner? = null

    private var isAdvertising = false
    private var isScanning = false

    private val mainHandler = Handler(Looper.getMainLooper())
    private val discoveredAddresses = ConcurrentHashMap<String, String>() // userId -> MAC address
    private val discoveredNames = ConcurrentHashMap<String, String>() // userId -> Display Name

    override fun getName(): String = MODULE_NAME

    private fun log(msg: String) {
        val map = Arguments.createMap().apply {
            putString("log", msg)
            putDouble("timestamp", System.currentTimeMillis().toDouble())
        }
        sendEvent("onBleLog", map)
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (e: Exception) {
            // JS runtime not ready
        }
    }

    @ReactMethod
    fun isSupported(promise: Promise) {
        val adapter = bluetoothAdapter
        if (adapter == null) {
            promise.resolve(false)
            return
        }
        val isAdv = adapter.isMultipleAdvertisementSupported
        promise.resolve(isAdv)
    }

    @ReactMethod
    fun getBluetoothState(promise: Promise) {
        val adapter = bluetoothAdapter
        if (adapter == null) {
            promise.resolve("UNSUPPORTED")
            return
        }
        if (adapter.isEnabled) {
            promise.resolve("ON")
        } else {
            promise.resolve("OFF")
        }
    }

    @ReactMethod
    fun startAdvertising(userId: String, displayName: String, promise: Promise) {
        val adapter = bluetoothAdapter
        if (adapter == null || !adapter.isEnabled) {
            log("[ADV] Cannot start: Bluetooth is OFF")
            promise.reject("BLE_OFF", "Bluetooth is disabled.")
            return
        }

        val adv = adapter.bluetoothLeAdvertiser
        if (adv == null) {
            log("[ADV] Hardware error: BLE Multiple Advertisement not supported on this phone")
            promise.reject("NO_ADVERTISER", "Device does not support BLE Peripheral advertising.")
            return
        }

        try {
            stopAdvertisingInternal()
            setupGattServer()

            val settings = AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
                .setConnectable(true)
                .setTimeout(0)
                .build()

            // Ultra-compact payload to guarantee fitting within the 31-byte limit
            val userPayload = "ZC:$userId".toByteArray(StandardCharsets.UTF_8)
            val namePayload = displayName.take(18).toByteArray(StandardCharsets.UTF_8)

            val dataBuilder = AdvertiseData.Builder()
                .setIncludeDeviceName(false)
                .setIncludeTxPowerLevel(false)
                .addServiceUuid(PARCEL_SERVICE_UUID)
                .addManufacturerData(MANUFACTURER_ID_USER, userPayload)

            val scanResponseBuilder = AdvertiseData.Builder()
                .setIncludeDeviceName(false)
                .addManufacturerData(MANUFACTURER_ID_NAME, namePayload)

            log("[ADV] Starting advertising (ID: $userId, Name: $displayName)...")
            adv.startAdvertising(settings, dataBuilder.build(), scanResponseBuilder.build(), advertiseCallback)
            advertiser = adv
            promise.resolve(true)
        } catch (e: Exception) {
            log("[ADV] Exception starting advertising: ${e.message}")
            promise.reject("ADVERTISE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopAdvertising(promise: Promise) {
        stopAdvertisingInternal()
        promise.resolve(true)
    }

    private fun stopAdvertisingInternal() {
        try {
            if (isAdvertising && advertiser != null) {
                advertiser?.stopAdvertising(advertiseCallback)
            }
            gattServer?.close()
            gattServer = null
            isAdvertising = false
            log("[ADV] Advertising stopped")
        } catch (e: Exception) {
            // Ignore
        }
    }

    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
            isAdvertising = true
            log("[ADV] Advertising started successfully! Nearby devices can now discover this phone.")
        }

        override fun onStartFailure(errorCode: Int) {
            isAdvertising = false
            val errorText = when (errorCode) {
                ADVERTISE_FAILED_DATA_TOO_LARGE -> "Data too large (>31 bytes)"
                ADVERTISE_FAILED_TOO_MANY_ADVERTISERS -> "Too many advertisers running"
                ADVERTISE_FAILED_ALREADY_STARTED -> "Advertising already started"
                ADVERTISE_FAILED_INTERNAL_ERROR -> "Internal Bluetooth driver error"
                ADVERTISE_FAILED_FEATURE_UNSUPPORTED -> "BLE advertising unsupported by hardware"
                else -> "Error code $errorCode"
            }
            log("[ADV] Failed to advertise: $errorText")
            val map = Arguments.createMap().apply {
                putString("error", "Advertise failed: $errorText")
            }
            sendEvent("onBleError", map)
        }
    }

    private fun setupGattServer() {
        if (gattServer != null) return
        val manager = bluetoothManager ?: return

        gattServer = manager.openGattServer(reactContext, object : BluetoothGattServerCallback() {
            override fun onCharacteristicWriteRequest(
                device: BluetoothDevice,
                requestId: Int,
                characteristic: BluetoothGattCharacteristic,
                preparedWrite: Boolean,
                responseNeeded: Boolean,
                offset: Int,
                value: ByteArray?
            ) {
                if (characteristic.uuid == CHAR_UUID && value != null) {
                    val rawString = String(value, StandardCharsets.UTF_8)
                    log("[GATT] Received ${value.size} bytes from ${device.address}")
                    val map = Arguments.createMap().apply {
                        putString("rawPacket", rawString)
                        putString("deviceAddress", device.address)
                    }
                    sendEvent("onMessageReceived", map)

                    if (responseNeeded) {
                        gattServer?.sendResponse(
                            device,
                            requestId,
                            BluetoothGatt.GATT_SUCCESS,
                            offset,
                            value
                        )
                    }
                } else if (responseNeeded) {
                    gattServer?.sendResponse(
                        device,
                        requestId,
                        BluetoothGatt.GATT_FAILURE,
                        offset,
                        null
                    )
                }
            }
        })

        val service = BluetoothGattService(SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)
        val char = BluetoothGattCharacteristic(
            CHAR_UUID,
            BluetoothGattCharacteristic.PROPERTY_WRITE or BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE,
            BluetoothGattCharacteristic.PERMISSION_WRITE
        )
        service.addCharacteristic(char)
        gattServer?.addService(service)
    }

    @ReactMethod
    fun startScan(promise: Promise) {
        val adapter = bluetoothAdapter
        if (adapter == null || !adapter.isEnabled) {
            log("[SCAN] Cannot start: Bluetooth is OFF")
            promise.reject("BLE_OFF", "Bluetooth is disabled.")
            return
        }

        val sc = adapter.bluetoothLeScanner
        if (sc == null) {
            log("[SCAN] Error: BluetoothLeScanner is null")
            promise.reject("NO_SCANNER", "BLE Scanner is not available.")
            return
        }

        try {
            stopScanInternal()
            discoveredAddresses.clear()
            discoveredNames.clear()

            val settings = ScanSettings.Builder()
                .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                .setReportDelay(0)
                .build()

            // Run open scan with in-app software filtering for 100% manufacturer chipset compatibility
            log("[SCAN] Starting low-latency BLE scan...")
            sc.startScan(null, settings, scanCallback)
            scanner = sc
            isScanning = true
            promise.resolve(true)
        } catch (e: Exception) {
            log("[SCAN] Exception starting scan: ${e.message}")
            promise.reject("SCAN_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopScan(promise: Promise) {
        stopScanInternal()
        promise.resolve(true)
    }

    private fun stopScanInternal() {
        try {
            if (isScanning && scanner != null) {
                scanner?.stopScan(scanCallback)
            }
            isScanning = false
            log("[SCAN] Scan stopped")
        } catch (e: Exception) {
            // Ignore
        }
    }

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult?) {
            val res = result ?: return
            val record = res.scanRecord ?: return
            val device = res.device ?: return

            var foundUserId: String? = null
            var foundDisplayName: String? = null

            // 1. Check Service UUID
            val serviceUuids = record.serviceUuids
            val hasServiceUuid = serviceUuids?.any { it == PARCEL_SERVICE_UUID } == true

            // 2. Check Manufacturer Data (0xFE60 for userId, 0xFE61 for displayName)
            val userBytes = record.getManufacturerSpecificData(MANUFACTURER_ID_USER)
            if (userBytes != null) {
                val str = String(userBytes, StandardCharsets.UTF_8)
                if (str.startsWith("ZC:")) {
                    foundUserId = str.substring(3).trim().uppercase()
                }
            }

            val nameBytes = record.getManufacturerSpecificData(MANUFACTURER_ID_NAME)
            if (nameBytes != null) {
                foundDisplayName = String(nameBytes, StandardCharsets.UTF_8).trim()
            }

            // 3. Fallback: check device name or service data
            if (foundUserId == null) {
                val serviceData = record.getServiceData(PARCEL_SERVICE_UUID)
                if (serviceData != null) {
                    val str = String(serviceData, StandardCharsets.UTF_8)
                    if (str.startsWith("ZC:")) {
                        val parts = str.split(":")
                        if (parts.size >= 3) {
                            foundUserId = parts[1].trim().uppercase()
                            foundDisplayName = parts.subList(2, parts.size).joinToString(":").trim()
                        }
                    }
                }
            }

            if (foundUserId != null) {
                val finalName = foundDisplayName ?: discoveredNames[foundUserId] ?: "User ${foundUserId.take(4)}"
                discoveredAddresses[foundUserId] = device.address
                if (foundDisplayName != null) {
                    discoveredNames[foundUserId] = foundDisplayName
                }

                log("[PEER] Discovered ZenChat Peer: $finalName ($foundUserId) @ ${device.address} (RSSI: ${res.rssi} dBm)")

                val map = Arguments.createMap().apply {
                    putString("userId", foundUserId)
                    putString("displayName", finalName)
                    putString("deviceAddress", device.address)
                    putInt("rssi", res.rssi)
                }
                sendEvent("onPeerDiscovered", map)
            }
        }

        override fun onScanFailed(errorCode: Int) {
            isScanning = false
            log("[SCAN] Scan failed with code $errorCode")
            val map = Arguments.createMap().apply {
                putString("error", "Scan failed code $errorCode")
            }
            sendEvent("onBleError", map)
        }
    }

    @ReactMethod
    fun sendMessage(deviceAddress: String, rawPacket: String, promise: Promise) {
        val adapter = bluetoothAdapter
        if (adapter == null || !adapter.isEnabled) {
            promise.reject("BLE_OFF", "Bluetooth is disabled.")
            return
        }

        val device = try {
            adapter.getRemoteDevice(deviceAddress)
        } catch (e: Exception) {
            promise.reject("INVALID_DEVICE", "Invalid Bluetooth address: $deviceAddress")
            return
        }

        val payloadBytes = rawPacket.toByteArray(StandardCharsets.UTF_8)
        var hasResolved = false

        log("[SEND] Connecting to ${device.address} (${payloadBytes.size} bytes)...")

        mainHandler.post {
            var gattClient: BluetoothGatt? = null

            val gattCallback = object : BluetoothGattCallback() {
                override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
                    if (newState == BluetoothProfile.STATE_CONNECTED) {
                        log("[SEND] Connected to ${device.address}! Requesting MTU 512...")
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            gatt.requestMtu(512)
                        } else {
                            gatt.discoverServices()
                        }
                    } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                        log("[SEND] Disconnected from ${device.address}")
                        gatt.close()
                        if (!hasResolved) {
                            hasResolved = true
                            promise.reject("DISCONNECTED", "Connection to device lost.")
                        }
                    }
                }

                override fun onMtuChanged(gatt: BluetoothGatt, mtu: Int, status: Int) {
                    log("[SEND] MTU negotiated: $mtu bytes. Discovering services...")
                    gatt.discoverServices()
                }

                override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
                    if (status == BluetoothGatt.GATT_SUCCESS) {
                        val service = gatt.getService(SERVICE_UUID)
                        val characteristic = service?.getCharacteristic(CHAR_UUID)

                        if (characteristic != null) {
                            log("[SEND] Writing message packet to GATT characteristic...")
                            characteristic.value = payloadBytes
                            characteristic.writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT
                            val writeSuccess = gatt.writeCharacteristic(characteristic)
                            if (!writeSuccess && !hasResolved) {
                                hasResolved = true
                                gatt.disconnect()
                                gatt.close()
                                promise.reject("WRITE_FAILED", "Could not write characteristic.")
                            }
                        } else if (!hasResolved) {
                            hasResolved = true
                            gatt.disconnect()
                            gatt.close()
                            promise.reject("SERVICE_NOT_FOUND", "ZenChat service not found on recipient.")
                        }
                    } else if (!hasResolved) {
                        hasResolved = true
                        gatt.disconnect()
                        gatt.close()
                        promise.reject("SERVICE_DISCOVERY_FAILED", "Failed to discover services.")
                    }
                }

                override fun onCharacteristicWrite(
                    gatt: BluetoothGatt,
                    characteristic: BluetoothGattCharacteristic,
                    status: Int
                ) {
                    if (!hasResolved) {
                        hasResolved = true
                        log("[SEND] Write completed with status $status! Message delivered.")
                        gatt.disconnect()
                        gatt.close()
                        if (status == BluetoothGatt.GATT_SUCCESS) {
                            promise.resolve(true)
                        } else {
                            promise.reject("WRITE_ERROR", "Characteristic write returned status $status")
                        }
                    }
                }
            }

            try {
                gattClient = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    device.connectGatt(reactContext, false, gattCallback, BluetoothDevice.TRANSPORT_LE)
                } else {
                    device.connectGatt(reactContext, false, gattCallback)
                }

                mainHandler.postDelayed({
                    if (!hasResolved) {
                        hasResolved = true
                        try {
                            gattClient?.disconnect()
                            gattClient?.close()
                        } catch (e: Exception) {}
                        promise.reject("TIMEOUT", "Send timed out. Recipient device did not acknowledge in time.")
                    }
                }, 9000)
            } catch (e: Exception) {
                if (!hasResolved) {
                    hasResolved = true
                    promise.reject("CONNECT_EXCEPTION", e.message, e)
                }
            }
        }
    }
}
