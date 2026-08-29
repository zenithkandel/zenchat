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
    private val discoveredDevices = ConcurrentHashMap<String, String>()

    override fun getName(): String = MODULE_NAME

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
        val isAdvSupported = adapter.isMultipleAdvertisementSupported
        promise.resolve(isAdvSupported)
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
            promise.reject("BLE_OFF", "Bluetooth is disabled.")
            return
        }

        val adv = adapter.bluetoothLeAdvertiser
        if (adv == null) {
            promise.reject("NO_ADVERTISER", "Device does not support BLE Peripheral mode.")
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

            // Service payload format: "ZC:<userId>:<displayName>"
            val payload = "ZC:$userId:$displayName"
            val payloadBytes = payload.toByteArray(StandardCharsets.UTF_8)

            val dataBuilder = AdvertiseData.Builder()
                .setIncludeDeviceName(false)
                .setIncludeTxPowerLevel(false)
                .addServiceUuid(PARCEL_SERVICE_UUID)
                .addServiceData(PARCEL_SERVICE_UUID, payloadBytes)

            val scanResponseBuilder = AdvertiseData.Builder()
                .setIncludeDeviceName(true)
                .addServiceUuid(PARCEL_SERVICE_UUID)

            adv.startAdvertising(settings, dataBuilder.build(), scanResponseBuilder.build(), advertiseCallback)
            advertiser = adv
            isAdvertising = true
            promise.resolve(true)
        } catch (e: Exception) {
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
        } catch (e: Exception) {
            // Ignore
        }
    }

    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
            isAdvertising = true
        }

        override fun onStartFailure(errorCode: Int) {
            isAdvertising = false
            val map = Arguments.createMap().apply {
                putString("error", "Advertise failed code $errorCode")
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
            promise.reject("BLE_OFF", "Bluetooth is disabled.")
            return
        }

        val sc = adapter.bluetoothLeScanner
        if (sc == null) {
            promise.reject("NO_SCANNER", "BLE Scanner is not available.")
            return
        }

        try {
            stopScanInternal()
            discoveredDevices.clear()

            val filter = ScanFilter.Builder()
                .setServiceUuid(PARCEL_SERVICE_UUID)
                .build()

            val settings = ScanSettings.Builder()
                .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                .setReportDelay(0)
                .build()

            sc.startScan(listOf(filter), settings, scanCallback)
            scanner = sc
            isScanning = true
            promise.resolve(true)
        } catch (e: Exception) {
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
        } catch (e: Exception) {
            // Ignore
        }
    }

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult?) {
            val res = result ?: return
            val record = res.scanRecord ?: return
            val device = res.device ?: return

            // Extract service data payload
            var payloadStr: String? = null
            val serviceData = record.getServiceData(PARCEL_SERVICE_UUID)
            if (serviceData != null) {
                payloadStr = String(serviceData, StandardCharsets.UTF_8)
            } else if (record.deviceName != null && record.deviceName!!.startsWith("ZC:")) {
                payloadStr = record.deviceName
            }

            if (payloadStr != null && payloadStr.startsWith("ZC:")) {
                val parts = payloadStr.split(":")
                if (parts.size >= 3) {
                    val userId = parts[1].trim().uppercase()
                    val displayName = parts.subList(2, parts.size).joinToString(":").trim()

                    discoveredDevices[userId] = device.address

                    val map = Arguments.createMap().apply {
                        putString("userId", userId)
                        putString("displayName", displayName)
                        putString("deviceAddress", device.address)
                        putInt("rssi", res.rssi)
                    }
                    sendEvent("onPeerDiscovered", map)
                }
            }
        }

        override fun onScanFailed(errorCode: Int) {
            isScanning = false
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

        mainHandler.post {
            var gattClient: BluetoothGatt? = null

            val gattCallback = object : BluetoothGattCallback() {
                override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
                    if (newState == BluetoothProfile.STATE_CONNECTED) {
                        gatt.discoverServices()
                    } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                        gatt.close()
                        if (!hasResolved) {
                            hasResolved = true
                            promise.reject("DISCONNECTED", "Connection to device lost.")
                        }
                    }
                }

                override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
                    if (status == BluetoothGatt.GATT_SUCCESS) {
                        val service = gatt.getService(SERVICE_UUID)
                        val characteristic = service?.getCharacteristic(CHAR_UUID)

                        if (characteristic != null) {
                            characteristic.value = payloadBytes
                            characteristic.writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT
                            val writeSuccess = gatt.writeCharacteristic(characteristic)
                            if (!writeSuccess && !hasResolved) {
                                hasResolved = true
                                gatt.disconnect()
                                gatt.close()
                                promise.reject("WRITE_FAILED", "Could not write to characteristic.")
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

                // Safety timeout: 8 seconds
                mainHandler.postDelayed({
                    if (!hasResolved) {
                        hasResolved = true
                        try {
                            gattClient?.disconnect()
                            gattClient?.close()
                        } catch (e: Exception) {}
                        promise.reject("TIMEOUT", "Send timed out. Peer is not responding.")
                    }
                }, 8000)
            } catch (e: Exception) {
                if (!hasResolved) {
                    hasResolved = true
                    promise.reject("CONNECT_EXCEPTION", e.message, e)
                }
            }
        }
    }
}
