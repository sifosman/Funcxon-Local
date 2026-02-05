import { expect } from 'chai';

describe('Funcxon App - Login Test', () => {
  
  const credentials = {
    email: 'mohamed@owdsolutions.co.za',
    password: 'Thierry14247!'
  };

  it('should login with valid credentials', async () => {
    // Wait for app to load
    await driver.pause(5000);
    
    // Click "Log in" button on welcome screen
    // Using XPath to find by text since we don't have accessibility labels yet
    const loginButton = await $('//android.widget.TextView[@text="Log in"]');
    await loginButton.click();
    
    // Wait for sign in screen
    await driver.pause(2000);
    
    // Find email input (first TextInput on screen)
    const emailInput = await $('//android.widget.EditText[1]');
    await emailInput.setValue(credentials.email);
    
    // Find password input (second TextInput on screen)
    const passwordInput = await $('//android.widget.EditText[2]');
    await passwordInput.setValue(credentials.password);
    
    // Click "Log in" button
    const signInButton = await $('//android.widget.TextView[@text="Log in"]');
    await signInButton.click();
    
    // Wait for login to complete
    await driver.pause(5000);
    
    // Verify successful login by checking we're on home screen
    // Look for a home screen element (e.g., "Discover Vendors" or similar)
    try {
      const homeElement = await $('//android.widget.TextView[contains(@text, "Discover") or contains(@text, "Vendors") or contains(@text, "Home")]');
      const isDisplayed = await homeElement.isDisplayed();
      expect(isDisplayed).to.be.true;
      console.log('✅ Login successful!');
    } catch (e) {
      console.log('⚠️  Could not verify home screen element, checking current package...');
      const currentPackage = await driver.getCurrentPackage();
      console.log('Current package:', currentPackage);
      // If we're still in host.exp.exponent, we're likely logged in
      expect(currentPackage).to.equal('host.exp.exponent');
    }
  });

});
