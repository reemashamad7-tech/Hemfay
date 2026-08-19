import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { bluetoothService, DeviceInfo } from '../services/bluetoothService';
import { Bluetooth, Signal, Battery, AlertCircle, RefreshCw, CheckCircle, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DeviceConnectionScreen: React.FC = () => {
  const navigate = useNavigate();
  const { deviceState, pairedDevice, deviceError, setDeviceState, addToast, t, language } = useStore();
  const [discoveredDevice, setDiscoveredDevice] = useState<DeviceInfo | null>(null);

  // Failure simulation settings
  const [simulateBluetoothOff, setSimulateBluetoothOff] = useState(false);
  const [simulateTimeout, setSimulateTimeout] = useState(false);

  const handleScan = async () => {
    setDiscoveredDevice(null);
    setDeviceState('Scanning', null, null);
    
    try {
      await bluetoothService.startScan(simulateBluetoothOff);
      const dev = bluetoothService.getPairedDevice();
      setDiscoveredDevice(dev);
      setDeviceState('DeviceFound', dev, null);
      addToast(language === 'ar' ? 'تم العثور على جهاز المحلل! جاهز للاتصال.' : 'Analyzer found! Ready to connect.', 'info');
    } catch (err: any) {
      setDeviceState('Failed', null, err.message);
      addToast((language === 'ar' ? 'فشل فحص البلوتوث: ' : 'Bluetooth scan failed: ') + err.message, 'warning');
    }
  };

  const handleConnect = async () => {
    if (!discoveredDevice) return;
    setDeviceState('Connecting', discoveredDevice, null);

    try {
      await bluetoothService.connectDevice(discoveredDevice, simulateTimeout);
      setDeviceState('Connected', discoveredDevice, null);
      addToast(language === 'ar' ? 'تم توصيل الجهاز بنجاح.' : 'Device connected successfully.', 'success');
    } catch (err: any) {
      setDeviceState('Failed', null, err.message);
      addToast((language === 'ar' ? 'فشل الاتصال: ' : 'Connection failed: ') + err.message, 'error');
    }
  };

  const handleDisconnect = () => {
    bluetoothService.disconnect();
    setDeviceState('Disconnected', null, null);
    setDiscoveredDevice(null);
    addToast(language === 'ar' ? 'تم قطع الاتصال بالجهاز.' : 'Device disconnected.', 'info');
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-text-primary">{t('hemafyAnalyzer')}</h1>
        <p className="text-xs font-semibold text-text-secondary mt-1">
          {t('deviceSubtitle')}
        </p>
      </div>

      {/* Main Connection Card */}
      <div className="bg-white rounded-primary border border-burgundy-soft/40 p-6 space-y-6 shadow-sm">
        {/* Status Indicator Banner */}
        <div className="flex items-center justify-between pb-4 border-b border-burgundy-soft/20">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full ${
              deviceState === 'Connected' 
                ? 'bg-success/10 text-success' 
                : deviceState === 'Failed' 
                  ? 'bg-error/10 text-error' 
                  : 'bg-burgundy-light text-burgundy'
            }`}>
              <Bluetooth size={24} className={deviceState === 'Scanning' ? 'animate-spin' : ''} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('deviceStatus')}</p>
              <h2 className="text-sm font-black text-text-primary">
                {deviceState === 'Disconnected' && t('disconnected')}
                {deviceState === 'Scanning' && t('scanningForAnalyzer')}
                {deviceState === 'DeviceFound' && t('deviceDiscovered')}
                {deviceState === 'Connecting' && t('connectingToAnalyzer')}
                {deviceState === 'Connected' && t('connected')}
                {deviceState === 'Failed' && t('connectionFailed')}
              </h2>
            </div>
          </div>

          {deviceState === 'Connected' && (
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
            </span>
          )}
        </div>

        {/* Central Display / Visual states */}
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {/* DISCONNECTED */}
            {deviceState === 'Disconnected' && (
              <motion.div
                key="disconnected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="w-20 h-20 rounded-full bg-burgundy-light flex items-center justify-center mx-auto text-burgundy opacity-40">
                  <Smartphone size={36} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-text-secondary">{t('scanInstructions')}</p>
                </div>
              </motion.div>
            )}

            {/* SCANNING */}
            {deviceState === 'Scanning' && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <div className="absolute w-24 h-24 rounded-full border border-burgundy/10 animate-ping" />
                  <div className="absolute w-16 h-16 rounded-full border border-burgundy/20 animate-ping" style={{ animationDelay: '0.5s' }} />
                  <div className="w-12 h-12 rounded-full bg-burgundy text-white flex items-center justify-center">
                    <Bluetooth size={20} className="animate-pulse" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-text-muted">{t('scanningForAnalyzer')}</p>
              </motion.div>
            )}

            {/* DEVICE FOUND / CONNECTING */}
            {(deviceState === 'DeviceFound' || deviceState === 'Connecting') && discoveredDevice && (
              <motion.div
                key="device-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-xs p-4 rounded-primary border border-burgundy-soft bg-burgundy-light/10 text-start space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="text-burgundy shrink-0" size={18} />
                    <span className="text-xs font-bold text-text-primary">{discoveredDevice.name}</span>
                  </div>
                  <span className="text-[9px] font-bold text-burgundy tracking-wider uppercase bg-burgundy-soft px-2 py-0.5 rounded-full">
                    {discoveredDevice.id.split('-').pop()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-[11px] text-text-secondary border-t border-burgundy-soft/20 pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <Signal size={12} className="text-burgundy" />
                    <span>{discoveredDevice.signalStrength} dBm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Battery size={14} className="text-success" />
                    <span>{discoveredDevice.batteryLevel}%</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CONNECTED */}
            {deviceState === 'Connected' && pairedDevice && (
              <motion.div
                key="connected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
                  <CheckCircle size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-success uppercase tracking-wider">{t('connected')}</p>
                  <p className="text-sm font-black text-text-primary">{pairedDevice.name}</p>
                </div>
              </motion.div>
            )}

            {/* FAILED */}
            {deviceState === 'Failed' && (
              <motion.div
                key="failed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 text-center max-w-sm"
              >
                <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
                  <AlertCircle size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-error uppercase tracking-wider">{t('connectionFailed')}</p>
                  <p className="text-xs text-text-secondary leading-relaxed px-4">
                    {deviceError || t('scanInstructions')}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Button */}
        <div>
          {deviceState === 'Disconnected' && (
            <button
              onClick={handleScan}
              className="w-full bg-burgundy hover:bg-burgundy-dark text-white font-bold text-xs py-3.5 rounded-primary transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-burgundy/10"
            >
              <span>{t('scanForDevices')}</span>
            </button>
          )}

          {deviceState === 'Scanning' && (
            <button
              disabled
              className="w-full bg-burgundy-soft text-burgundy opacity-70 font-bold text-xs py-3.5 rounded-primary flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} className="animate-spin" />
              <span>{t('scanning')}</span>
            </button>
          )}

          {deviceState === 'DeviceFound' && (
            <button
              onClick={handleConnect}
              className="w-full bg-burgundy hover:bg-burgundy-dark text-white font-bold text-xs py-3.5 rounded-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('pairAndConnect')}</span>
            </button>
          )}

          {deviceState === 'Connecting' && (
            <button
              disabled
              className="w-full bg-burgundy-soft text-burgundy opacity-70 font-bold text-xs py-3.5 rounded-primary flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} className="animate-spin" />
              <span>{t('connecting')}</span>
            </button>
          )}

          {deviceState === 'Connected' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDisconnect}
                className="bg-white border border-burgundy text-burgundy hover:bg-burgundy-light font-bold text-xs py-3.5 rounded-primary transition-all cursor-pointer"
              >
                {t('signOut')}
              </button>
              <button
                onClick={() => navigate('/test')}
                className="bg-burgundy hover:bg-burgundy-dark text-white font-bold text-xs py-3.5 rounded-primary transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-burgundy/10"
              >
                {t('startBloodTest')}
              </button>
            </div>
          )}

          {deviceState === 'Failed' && (
            <button
              onClick={handleScan}
              className="w-full bg-burgundy hover:bg-burgundy-dark text-white font-bold text-xs py-3.5 rounded-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={16} />
              <span>{t('retryScanning')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Simulator Control Panel */}
      <div className="bg-[#FCF4F6] border border-burgundy-soft/40 rounded-primary p-4 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-burgundy uppercase tracking-wider">{t('simulatorControls')}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2.5 p-2 rounded-primary bg-white border border-burgundy-soft/20 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={simulateBluetoothOff}
              onChange={(e) => setSimulateBluetoothOff(e.target.checked)}
              className="accent-burgundy"
            />
            <div className="text-start">
              <p className="text-[10px] font-bold text-text-primary">{t('simulateBtOff')}</p>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-2 rounded-primary bg-white border border-burgundy-soft/20 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={simulateTimeout}
              onChange={(e) => setSimulateTimeout(e.target.checked)}
              className="accent-burgundy"
            />
            <div className="text-start">
              <p className="text-[10px] font-bold text-text-primary">{t('simulateTimeout')}</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
export default DeviceConnectionScreen;
