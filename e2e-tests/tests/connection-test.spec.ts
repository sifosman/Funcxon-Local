import { expect } from 'chai';

describe('Android Emulator Connection Test', () => {
  
  it('should verify emulator is connected and responsive', async () => {
    // Get device info
    const deviceInfo = await driver.getDeviceInfo();
    console.log('Device Info:', deviceInfo);
    
    // Verify we can interact with the device
    await driver.pause(1000);
    
    // Get current package (should be system launcher if no app)
    const currentPackage = await driver.getCurrentPackage();
    console.log('Current Package:', currentPackage);
    
    // If you have the app installed, this test will pass
    // Otherwise it shows the device is connected
    expect(deviceInfo).to.exist;
  });

  it('should launch Chrome as a demo', async () => {
    // Launch Chrome to demonstrate automation works
    await driver.execute('mobile: startActivity', {
      appPackage: 'com.android.chrome',
      appActivity: 'com.google.android.apps.chrome.Main'
    });
    
    await driver.pause(2000);
    
    // Verify Chrome opened
    const currentPackage = await driver.getCurrentPackage();
    expect(currentPackage).to.equal('com.android.chrome');
    
    console.log('✅ Successfully automated Chrome on emulator!');
  });

});
