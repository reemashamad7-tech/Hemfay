export type BluetoothState = 'Disconnected' | 'Scanning' | 'DeviceFound' | 'Connecting' | 'Connected' | 'Failed';

export interface DeviceInfo {
  id: string;
  name: string;
  signalStrength: number;
  batteryLevel: number;
}

class BluetoothServiceMock {
  private activeDevice: DeviceInfo | null = null;
  private pairedDevice: DeviceInfo | null = null;

  async startScan(simulateBluetoothOff: boolean = false): Promise<void> {
    // Delay to simulate search time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (simulateBluetoothOff) {
      throw new Error('Bluetooth adapter is turned off. Please enable Bluetooth on your system.');
    }

    this.activeDevice = {
      id: 'hemafy-analyser-8f16',
      name: 'Hemafy Analyzer v1.4',
      signalStrength: -52,
      batteryLevel: 88,
    };
  }

  getPairedDevice(): DeviceInfo {
    if (!this.activeDevice) {
      throw new Error('No device found. Please scan first.');
    }
    return this.activeDevice;
  }

  async connectDevice(device: DeviceInfo, simulateTimeout: boolean = false): Promise<void> {
    // Delay to simulate connection time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (simulateTimeout) {
      throw new Error('Connection handshake timed out. The device is not responding. Please retry.');
    }

    this.pairedDevice = device;
  }

  disconnect(): void {
    this.pairedDevice = null;
    this.activeDevice = null;
  }

  async runAnalysis(
    onProgress: (percent: number, stepText: string) => void
  ): Promise<{ hemoglobin: number; ferritin: number }> {
    const steps = [
      { maxPercent: 15, text: 'Preparing test chamber...' },
      { maxPercent: 40, text: 'Calibrating optical sensors...' },
      { maxPercent: 70, text: 'Analyzing blood sample biochemistry...' },
      { maxPercent: 90, text: 'Calculating hemoglobin and ferritin ratios...' },
      { maxPercent: 100, text: 'Finalizing telemetry diagnostic report...' },
    ];

    let currentPercent = 0;

    for (const step of steps) {
      while (currentPercent < step.maxPercent) {
        currentPercent += Math.floor(Math.random() * 5) + 3;
        if (currentPercent > step.maxPercent) {
          currentPercent = step.maxPercent;
        }
        onProgress(currentPercent, step.text);
        // Delay to simulate step duration
        await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 100));
      }
    }

    // Generate realistic hemoglobin and ferritin values
    // Hemoglobin reference: 12.0 - 16.0 g/dL for women, 13.5 - 17.5 g/dL for men
    // Ferritin reference: 15 - 150 ng/mL
    // We occasionally generate low iron metrics to simulate clinical feedback
    const isAnemic = Math.random() > 0.6;
    let hemoglobin: number;
    let ferritin: number;

    if (isAnemic) {
      hemoglobin = parseFloat((10.2 + Math.random() * 1.5).toFixed(1));
      ferritin = parseFloat((8 + Math.random() * 6).toFixed(0));
    } else {
      hemoglobin = parseFloat((13.1 + Math.random() * 2.5).toFixed(1));
      ferritin = parseFloat((35 + Math.random() * 70).toFixed(0));
    }

    return { hemoglobin, ferritin };
  }
}

export const bluetoothService = new BluetoothServiceMock();
