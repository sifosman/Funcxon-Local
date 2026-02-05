Running 'gradlew :app:assembleRelease' in /home/expo/workingdir/build/android
Downloading https://services.gradle.org/distributions/gradle-8.14.3-bin.zip
10%.
20%.
30%.
40%.
50%.
60
%.
70%.
80
%.
90%.
100%
Welcome to Gradle 8.14.3!
Here are the highlights of this release:
 - Java 24 support
 - GraalVM Native Image toolchain selection
- Enhancements to test reporting
 - Build Authoring improvements
For more details see https://docs.gradle.org/8.14.3/release-notes.html
To honour the JVM settings for this build a single-use Daemon process will be forked. For more on this, please refer to https://docs.gradle.org/8.14.3/userguide/gradle_daemon.html#sec:disabling_the_daemon in the Gradle documentation.
Daemon will be stopped at the end of the build
> Configure project :expo-gradle-plugin:expo-autolinking-plugin
w: file:///home/expo/workingdir/build/node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-plugin/build.gradle.kts:25:3: 'kotlinOptions(KotlinJvmOptionsDeprecated /* = KotlinJvmOptions */.() -> Unit): Unit' is deprecated. Please migrate to the compilerOptions DSL. More details are here: https://kotl.in/u1r8ln
> Configure project :expo-gradle-plugin:expo-autolinking-settings-plugin
w: file:///home/expo/workingdir/build/node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/build.gradle.kts:30:3: 'kotlinOptions(KotlinJvmOptionsDeprecated /* = KotlinJvmOptions */.() -> Unit): Unit' is deprecated. Please migrate to the compilerOptions DSL. More details are here: https://kotl.in/u1r8ln
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:checkKotlinGradlePluginConfigurationErrors
SKIPPED
> Task :gradle-plugin:settings-plugin:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :gradle-plugin:shared:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:pluginDescriptors
> Task :gradle-plugin:settings-plugin:pluginDescriptors
> Task :gradle-plugin:settings-plugin:processResources
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:processResources
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:processResources NO-SOURCE
> Task :gradle-plugin:shared:processResources NO-SOURCE
> Task :gradle-plugin:shared:compileKotlin
> Task :gradle-plugin:shared:compileJava NO-SOURCE
> Task :gradle-plugin:shared:classes UP-TO-DATE
> Task :gradle-plugin:shared:jar
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:compileKotlin
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:compileJava NO-SOURCE
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:classes UP-TO-DATE
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:jar
> Task :gradle-plugin:settings-plugin:compileKotlin
> Task :gradle-plugin:settings-plugin:compileJava
NO-SOURCE
> Task :gradle-plugin:settings-plugin:classes
> Task :gradle-plugin:settings-plugin:jar
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:compileKotlin
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:compileJava NO-SOURCE
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:classes
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:jar
> Configure project :expo-dev-launcher-gradle-plugin
w: file:///home/expo/workingdir/build/node_modules/expo-dev-launcher/expo-dev-launcher-gradle-plugin/build.gradle.kts:25:3: 'kotlinOptions(KotlinJvmOptionsDeprecated /* = KotlinJvmOptions */.() -> Unit): Unit' is deprecated. Please migrate to the compilerOptions DSL. More details are here: https://kotl.in/u1r8ln
> Configure project :expo-module-gradle-plugin
w: file:///home/expo/workingdir/build/node_modules/expo-modules-core/expo-module-gradle-plugin/build.gradle.kts:58:3: 'kotlinOptions(KotlinJvmOptionsDeprecated /* = KotlinJvmOptions */.() -> Unit): Unit' is deprecated. Please migrate to the compilerOptions DSL. More details are here: https://kotl.in/u1r8ln
> Task :expo-module-gradle-plugin:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-dev-launcher-gradle-plugin:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :gradle-plugin:react-native-gradle-plugin:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-gradle-plugin:expo-autolinking-plugin:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-dev-launcher-gradle-plugin:pluginDescriptors
> Task :expo-module-gradle-plugin:pluginDescriptors
> Task :expo-dev-launcher-gradle-plugin:processResources
> Task :expo-module-gradle-plugin:processResources
> Task :expo-gradle-plugin:expo-autolinking-plugin:pluginDescriptors
> Task :expo-gradle-plugin:expo-autolinking-plugin:processResources
> Task :gradle-plugin:react-native-gradle-plugin:pluginDescriptors
> Task :gradle-plugin:react-native-gradle-plugin:processResources
> Task :expo-gradle-plugin:expo-autolinking-plugin:compileKotlin
> Task :expo-gradle-plugin:expo-autolinking-plugin:compileJava NO-SOURCE
> Task :expo-gradle-plugin:expo-autolinking-plugin:classes
> Task :expo-gradle-plugin:expo-autolinking-plugin:jar
> Task :gradle-plugin:react-native-gradle-plugin:compileKotlin
> Task :gradle-plugin:react-native-gradle-plugin:compileJava NO-SOURCE
> Task :gradle-plugin:react-native-gradle-plugin:classes
> Task :gradle-plugin:react-native-gradle-plugin:jar
> Task :expo-dev-launcher-gradle-plugin:compileKotlin
> Task :expo-dev-launcher-gradle-plugin:compileJava NO-SOURCE
> Task :expo-dev-launcher-gradle-plugin:classes
> Task :expo-dev-launcher-gradle-plugin:jar
> Task :expo-module-gradle-plugin:compileKotlin
w: file:///home/expo/workingdir/build/node_modules/expo-modules-core/expo-module-gradle-plugin/src/main/kotlin/expo/modules/plugin/android/AndroidLibraryExtension.kt:9:24 'var targetSdk: Int?' is deprecated. Will be removed from library DSL in v9.0. Use testOptions.targetSdk or/and lint.targetSdk instead.
> Task :expo-module-gradle-plugin:compileJava NO-SOURCE
> Task :expo-module-gradle-plugin:classes
> Task :expo-module-gradle-plugin:jar
> Configure project :
[32m[ExpoRootProject][0m Using the following versions:
- buildTools:  [32m36.0.0[0m
  - minSdk:      [32m24[0m
  - compileSdk:  [32m36[0m
  - targetSdk:   [32m36[0m
  - ndk:         [32m27.1.12297006[0m
  - kotlin:      [32m2.1.20[0m
  - ksp:         [32m2.1.20-2.0.1[0m
> Configure project :app
 ℹ️  [33mApplying gradle plugin[0m '[32mexpo-dev-launcher-gradle-plugin[0m'
> Configure project :expo
Using expo modules
  - [32mexpo-constants[0m (18.0.13)
  - [32mexpo-dev-client[0m (6.0.20)
  - [32mexpo-dev-launcher[0m (6.0.20)
  - [32mexpo-dev-menu[0m (7.0.18)
  - [32mexpo-dev-menu-interface[0m (2.0.0)
- [32mexpo-json-utils[0m (0.15.0)
  - [32mexpo-manifests[0m (1.0.10)
- [32mexpo-modules-core[0m (3.0.29)
- [32mexpo-updates-interface[0m (2.0.0)
- [33m[📦][0m [32mexpo-application[0m (7.0.8)
  - [33m[📦][0m [32mexpo-asset[0m (12.0.12)
  - [33m[📦][0m [32mexpo-crypto[0m (15.0.8)
  - [33m[📦][0m [32mexpo-document-picker[0m (14.0.8)
  - [33m[📦][0m [32mexpo-file-system[0m (19.0.21)
  - [33m[📦][0m [32mexpo-font[0m (14.0.10)
  - [33m[📦][0m [32mexpo-image-loader[0m (6.0.0)
  - [33m[📦][0m [32mexpo-image-picker[0m (17.0.10)
- [33m[📦][0m [32mexpo-keep-awake[0m (15.0.8)
  - [33m[📦][0m [32mexpo-linking[0m (8.0.10)
  - [33m[📦][0m [32mexpo-location[0m (19.0.8)
  - [33m[📦][0m [32mexpo-web-browser[0m (15.0.10)
Checking the license for package Android SDK Build-Tools 36 in /home/expo/Android/Sdk/licenses
License for package Android SDK Build-Tools 36 accepted.
Preparing "Install Android SDK Build-Tools 36 v.36.0.0".
"Install Android SDK Build-Tools 36 v.36.0.0" ready.
Installing Android SDK Build-Tools 36 in /home/expo/Android/Sdk/build-tools/36.0.0
"Install Android SDK Build-Tools 36 v.36.0.0" complete.
"Install Android SDK Build-Tools 36 v.36.0.0" finished.
[=========                              ] 25%
[=========                              ] 25% Fetch remote repository...        
[=======================================] 100% Fetch remote repository...
> Task :expo-json-utils:preBuild UP-TO-DATE
> Task :expo-dev-menu:preBuild UP-TO-DATE
> Task :expo-dev-launcher:preBuild UP-TO-DATE
> Task :expo-dev-client:preBuild UP-TO-DATE
> Task :expo-dev-menu-interface:preBuild UP-TO-DATE
> Task :expo-manifests:preBuild UP-TO-DATE
> Task :expo-updates-interface:preBuild UP-TO-DATE
> Task :expo-modules-core:preBuild UP-TO-DATE
> Task :react-native-gesture-handler:preBuild UP-TO-DATE
> Task :react-native-async-storage_async-storage:preBuild UP-TO-DATE
> Task :react-native-community_datetimepicker:preBuild UP-TO-DATE
> Task :react-native-screens:preBuild UP-TO-DATE
> Task :react-native-safe-area-context:preBuild UP-TO-DATE
> Task :expo-dev-client:preReleaseBuild UP-TO-DATE
> Task :react-native-webview:preBuild UP-TO-DATE
> Task :react-native-maps:preBuild UP-TO-DATE
> Task :expo-dev-launcher:preReleaseBuild UP-TO-DATE
> Task :expo-dev-menu-interface:preReleaseBuild UP-TO-DATE
> Task :expo-dev-menu:preReleaseBuild UP-TO-DATE
> Task :expo-json-utils:preReleaseBuild UP-TO-DATE
> Task :app:generateAutolinkingPackageList
> Task :app:generateCodegenSchemaFromJavaScript SKIPPED
> Task :app:generateCodegenArtifactsFromSchema SKIPPED
> Task :app:generateReactNativeEntryPoint
> Task :expo-manifests:preReleaseBuild UP-TO-DATE
> Task :expo-dev-client:mergeReleaseJniLibFolders
> Task :expo-manifests:mergeReleaseJniLibFolders
> Task :expo-json-utils:mergeReleaseJniLibFolders
> Task :expo-dev-launcher:mergeReleaseJniLibFolders
> Task :expo-dev-menu-interface:mergeReleaseJniLibFolders
> Task :expo-dev-menu:mergeReleaseJniLibFolders
> Task :expo-dev-client:mergeReleaseNativeLibs NO-SOURCE
> Task :expo-dev-launcher:mergeReleaseNativeLibs NO-SOURCE
> Task :expo-manifests:mergeReleaseNativeLibs NO-SOURCE
> Task :expo-json-utils:mergeReleaseNativeLibs NO-SOURCE
> Task :expo-dev-menu-interface:mergeReleaseNativeLibs NO-SOURCE
> Task :expo-dev-menu:mergeReleaseNativeLibs NO-SOURCE
> Task :expo-dev-menu-interface:copyReleaseJniLibsProjectOnly
> Task :expo-manifests:copyReleaseJniLibsProjectOnly
> Task :expo-json-utils:copyReleaseJniLibsProjectOnly
> Task :expo-dev-launcher:copyReleaseJniLibsProjectOnly
> Task :expo-updates-interface:preReleaseBuild UP-TO-DATE
> Task :react-native-async-storage_async-storage:preReleaseBuild
UP-TO-DATE
> Task :expo-dev-client:copyReleaseJniLibsProjectOnly
> Task :react-native-community_datetimepicker:preReleaseBuild UP-TO-DATE
> Task :react-native-gesture-handler:preReleaseBuild UP-TO-DATE
> Task :expo-modules-core:preReleaseBuild UP-TO-DATE
> Task :expo-dev-menu:copyReleaseJniLibsProjectOnly
> Task :react-native-maps:preReleaseBuild UP-TO-DATE
> Task :react-native-async-storage_async-storage:mergeReleaseJniLibFolders
> Task :expo-updates-interface:mergeReleaseJniLibFolders
> Task :expo-constants:createExpoConfig
> Task :react-native-community_datetimepicker:mergeReleaseJniLibFolders
> Task :expo-constants:preBuild
> Task :expo-constants:preReleaseBuild
> Task :react-native-gesture-handler:mergeReleaseJniLibFolders
> Task :react-native-async-storage_async-storage:mergeReleaseNativeLibs NO-SOURCE
> Task :react-native-community_datetimepicker:mergeReleaseNativeLibs
The NODE_ENV environment variable is required but was not specified. Ensure the project is bundled with Expo CLI or NODE_ENV is set. Using only .env.local and .env
NO-SOURCE
> Task :expo-updates-interface:mergeReleaseNativeLibs NO-SOURCE
> Task :react-native-maps:mergeReleaseJniLibFolders
> Task :react-native-gesture-handler:mergeReleaseNativeLibs NO-SOURCE
> Task :react-native-maps:mergeReleaseNativeLibs NO-SOURCE
> Task :react-native-async-storage_async-storage:copyReleaseJniLibsProjectOnly
> Task :react-native-community_datetimepicker:copyReleaseJniLibsProjectOnly
> Task :expo-updates-interface:copyReleaseJniLibsProjectOnly
> Task :react-native-safe-area-context:preReleaseBuild UP-TO-DATE
> Task :react-native-screens:preReleaseBuild UP-TO-DATE
> Task :react-native-webview:preReleaseBuild UP-TO-DATE
> Task :expo-constants:mergeReleaseJniLibFolders
> Task :react-native-maps:copyReleaseJniLibsProjectOnly
> Task :react-native-gesture-handler:copyReleaseJniLibsProjectOnly
> Task :react-native-community_datetimepicker:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :react-native-gesture-handler:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-constants:mergeReleaseNativeLibs NO-SOURCE
> Task :react-native-safe-area-context:mergeReleaseJniLibFolders
> Task :react-native-safe-area-context:mergeReleaseNativeLibs NO-SOURCE
> Task :react-native-webview:mergeReleaseJniLibFolders
> Task :react-native-webview:mergeReleaseNativeLibs NO-SOURCE
> Task :expo-constants:copyReleaseJniLibsProjectOnly
> Task :react-native-maps:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :react-native-safe-area-context:copyReleaseJniLibsProjectOnly
> Task :react-native-safe-area-context:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :react-native-webview:copyReleaseJniLibsProjectOnly
> Task :react-native-webview:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :react-native-maps:generateReleaseBuildConfig
> Task :react-native-community_datetimepicker:generateReleaseBuildConfig
> Task :react-native-safe-area-context:generateReleaseBuildConfig
> Task :react-native-gesture-handler:generateReleaseBuildConfig
> Task :react-native-maps:generateReleaseResValues
> Task :react-native-community_datetimepicker:generateReleaseResValues
> Task :react-native-safe-area-context:generateReleaseResValues
> Task :react-native-gesture-handler:generateReleaseResValues
> Task :react-native-webview:generateReleaseBuildConfig
> Task :react-native-maps:generateReleaseResources
> Task :react-native-webview:generateReleaseResValues
> Task :react-native-community_datetimepicker:generateReleaseResources
> Task :react-native-safe-area-context:generateReleaseResources
> Task :react-native-gesture-handler:generateReleaseResources
> Task :react-native-webview:generateReleaseResources
> Task :react-native-safe-area-context:packageReleaseResources
> Task :react-native-maps:packageReleaseResources
> Task :react-native-gesture-handler:packageReleaseResources
> Task :react-native-webview:packageReleaseResources
> Task :react-native-community_datetimepicker:packageReleaseResources
> Task :expo:generatePackagesList
> Task :expo:preBuild
> Task :app:preBuild
> Task :app:preReleaseBuild
> Task :app:mergeReleaseJniLibFolders
> Task :expo:preReleaseBuild
> Task :expo:mergeReleaseJniLibFolders
> Task :expo:mergeReleaseNativeLibs NO-SOURCE
> Task :expo:copyReleaseJniLibsProjectOnly
> Task :react-native-community_datetimepicker:javaPreCompileRelease
> Task :react-native-gesture-handler:javaPreCompileRelease
> Task :react-native-maps:javaPreCompileRelease
> Task :react-native-safe-area-context:javaPreCompileRelease
> Task :react-native-webview:javaPreCompileRelease
> Task :react-native-async-storage_async-storage:generateReleaseBuildConfig
> Task :react-native-async-storage_async-storage:generateReleaseResValues
> Task :react-native-async-storage_async-storage:generateReleaseResources
> Task :react-native-async-storage_async-storage:packageReleaseResources
> Task :react-native-safe-area-context:parseReleaseLocalResources
> Task :react-native-gesture-handler:parseReleaseLocalResources
> Task :react-native-maps:parseReleaseLocalResources
> Task :react-native-webview:parseReleaseLocalResources
> Task :react-native-async-storage_async-storage:parseReleaseLocalResources
> Task :react-native-community_datetimepicker:parseReleaseLocalResources
> Task :react-native-safe-area-context:generateReleaseRFile
> Task :react-native-community_datetimepicker:generateReleaseRFile
> Task :react-native-async-storage_async-storage:generateReleaseRFile
> Task :react-native-maps:generateReleaseRFile
> Task :react-native-webview:generateReleaseRFile
> Task :react-native-gesture-handler:generateReleaseRFile
> Task :react-native-async-storage_async-storage:javaPreCompileRelease
> Task :react-native-maps:compileReleaseKotlin NO-SOURCE
> Task :expo-modules-core:configureCMakeRelWithDebInfo[arm64-v8a]
Checking the license for package CMake 3.22.1 in /home/expo/Android/Sdk/licenses
License for package CMake 3.22.1 accepted.
Preparing "Install CMake 3.22.1 v.3.22.1".
"Install CMake 3.22.1 v.3.22.1" ready.
Installing CMake 3.22.1 in /home/expo/Android/Sdk/cmake/3.22.1
"Install CMake 3.22.1 v.3.22.1" complete.
"Install CMake 3.22.1 v.3.22.1" finished.
> Task :react-native-community_datetimepicker:compileReleaseKotlin
w: file:///home/expo/workingdir/build/node_modules/@react-native-community/datetimepicker/android/src/main/java/com/reactcommunity/rndatetimepicker/MaterialDatePickerModule.kt:21:20 'val currentActivity: Activity?' is deprecated. Deprecated in 0.80.0. Use getReactApplicationContext.getCurrentActivity() instead.
w: file:///home/expo/workingdir/build/node_modules/@react-native-community/datetimepicker/android/src/main/java/com/reactcommunity/rndatetimepicker/MaterialDatePickerModule.kt:21:20 This synthetic property is based on the getter function 'fun getCurrentActivity(): Activity?' from Kotlin. In the future, synthetic properties will be available only if the base getter function came from Java. Consider replacing this property access with a 'getCurrentActivity()' function call.
w: file:///home/expo/workingdir/build/node_modules/@react-native-community/datetimepicker/android/src/main/java/com/reactcommunity/rndatetimepicker/MaterialDatePickerModule.kt:26:20 'val currentActivity: Activity?' is deprecated. Deprecated in 0.80.0. Use getReactApplicationContext.getCurrentActivity() instead.
w: file:///home/expo/workingdir/build/node_modules/@react-native-community/datetimepicker/android/src/main/java/com/reactcommunity/rndatetimepicker/MaterialDatePickerModule.kt:26:20 This synthetic property is based on the getter function 'fun getCurrentActivity(): Activity?' from Kotlin. In the future, synthetic properties will be available only if the base getter function came from Java. Consider replacing this property access with a 'getCurrentActivity()' function call.
w: file:///home/expo/workingdir/build/node_modules/@react-native-community/datetimepicker/android/src/main/java/com/reactcommunity/rndatetimepicker/MaterialTimePickerModule.kt:22:20 'val currentActivity: Activity?' is deprecated. Deprecated in 0.80.0. Use getReactApplicationContext.getCurrentActivity() instead.
w: file:///home/expo/workingdir/build/node_modules/@react-native-community/datetimepicker/android/src/main/java/com/reactcommunity/rndatetimepicker/MaterialTimePickerModule.kt:22:20 This synthetic property is based on the getter function 'fun getCurrentActivity(): Activity?' from Kotlin. In the future, synthetic properties will be available only if the base getter function came from Java. Consider replacing this property access with a 'getCurrentActivity()' function call.
w: file:///home/expo/workingdir/build/node_modules/@react-native-community/datetimepicker/android/src/main/java/com/reactcommunity/rndatetimepicker/MaterialTimePickerModule.kt:27:20 'val currentActivity: Activity?' is deprecated. Deprecated in 0.80.0. Use getReactApplicationContext.getCurrentActivity() instead.
w: file:///home/expo/workingdir/build/node_modules/@react-native-community/datetimepicker/android/src/main/java/com/reactcommunity/rndatetimepicker/MaterialTimePickerModule.kt:27:20 This synthetic property is based on the getter function 'fun getCurrentActivity(): Activity?' from Kotlin. In the future, synthetic properties will be available only if the base getter function came from Java. Consider replacing this property access with a 'getCurrentActivity()' function call.
> Task :react-native-async-storage_async-storage:compileReleaseJavaWithJavac
Note: Some input files use or override a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
Note: /home/expo/workingdir/build/node_modules/@react-native-async-storage/async-storage/android/src/javaPackage/java/com/reactnativecommunity/asyncstorage/AsyncStoragePackage.java uses unchecked or unsafe operations.
Note: Recompile with -Xlint:unchecked for details.
> Task :react-native-safe-area-context:compileReleaseKotlin
w: file:///home/expo/workingdir/build/node_modules/react-native-safe-area-context/android/src/main/java/com/th3rdwave/safeareacontext/SafeAreaView.kt:59:23 'val uiImplementation: UIImplementation!' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-safe-area-context/android/src/paper/java/com/th3rdwave/safeareacontext/InsetsChangeEvent.kt:19:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
> Task :react-native-webview:compileReleaseKotlin
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:22:8 'object MapBuilder : Any' is deprecated. Use Kotlin's built-in collections extensions.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:82:18 'var allowFileAccessFromFileURLs: Boolean' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:83:18 'var allowUniversalAccessFromFileURLs: Boolean' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:124:21 'fun allowScanningByMediaScanner(): Unit' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:161:36 'var systemUiVisibility: Int' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:300:14 'object MapBuilder : Any' is deprecated. Use Kotlin's built-in collections extensions.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:350:34 Condition is always 'true'.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:369:38 'var allowUniversalAccessFromFileURLs: Boolean' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:430:51 Unchecked cast of 'Any?' to 'HashMap<String, String>'.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:486:23 'var savePassword: Boolean' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:487:23 'var saveFormData: Boolean' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:557:23 'var allowFileAccessFromFileURLs: Boolean' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:602:52 'static field FORCE_DARK_ON: Int' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:602:89 'static field FORCE_DARK_OFF: Int' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:603:35 'static fun setForceDark(p0: @NonNull() WebSettings, p1: Int): Unit' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:612:35 'static fun setForceDarkStrategy(p0: @NonNull() WebSettings, p1: Int): Unit' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:614:39 'static field DARK_STRATEGY_PREFER_WEB_THEME_OVER_USER_AGENT_DARKENING: Int' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:658:65 Unchecked cast of 'ArrayList<Any?>' to 'List<Map<String, String>>'.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:679:23 'var saveFormData: Boolean' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/SubResourceErrorEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/SubResourceErrorEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/SubResourceErrorEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/SubResourceErrorEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/SubResourceErrorEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:10:75 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:21:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:21:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:22:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:12:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:23:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:23:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:24:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:10:89 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:27:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:27:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:28:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
> Task :react-native-community_datetimepicker:compileReleaseJavaWithJavac
Note: Some input files use or override a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
> Task :react-native-safe-area-context:compileReleaseJavaWithJavac
Note: /home/expo/workingdir/build/node_modules/react-native-safe-area-context/android/src/paper/java/com/th3rdwave/safeareacontext/NativeSafeAreaContextSpec.java uses or overrides a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
> Task :react-native-webview:compileReleaseJavaWithJavac
> Task :react-native-maps:compileReleaseJavaWithJavac
Note: Some input files use or override a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
Note: Some input files use or override a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
Note: Some input files use unchecked or unsafe operations.
Note: Recompile with -Xlint:unchecked for details.
> Task :react-native-webview:bundleLibRuntimeToDirRelease
> Task :react-native-safe-area-context:bundleLibRuntimeToDirRelease
> Task :react-native-async-storage_async-storage:bundleLibRuntimeToDirRelease
> Task :react-native-community_datetimepicker:bundleLibRuntimeToDirRelease
> Task :react-native-maps:bundleLibRuntimeToDirRelease
> Task :react-native-gesture-handler:compileReleaseKotlin
w: file:///home/expo/workingdir/build/node_modules/react-native-gesture-handler/android/src/main/java/com/swmansion/gesturehandler/react/RNGestureHandlerRootView.kt:41:43 The corresponding parameter in the supertype 'ReactViewGroup' is named 'ev'. This may cause problems when calling this function with named arguments.
> Task :react-native-gesture-handler:compileReleaseJavaWithJavac
> Task :react-native-gesture-handler:bundleLibRuntimeToDirRelease
Note: /home/expo/workingdir/build/node_modules/react-native-gesture-handler/android/paper/src/main/java/com/swmansion/gesturehandler/NativeRNGestureHandlerModuleSpec.java uses or overrides a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
> Task :expo:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo:generateReleaseBuildConfig
> Task :expo:generateReleaseResValues
> Task :expo-constants:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo:generateReleaseResources
> Task :expo-constants:generateReleaseBuildConfig
> Task :expo-dev-client:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-constants:generateReleaseResValues
> Task :expo-constants:generateReleaseResources
> Task :expo:packageReleaseResources
> Task :expo-constants:packageReleaseResources
> Task :expo:parseReleaseLocalResources
> Task :expo-constants:parseReleaseLocalResources
> Task :expo:generateReleaseRFile
> Task :expo-dev-launcher:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :react-native-screens:configureCMakeRelWithDebInfo[arm64-v8a]
> Task :expo-dev-client:generateReleaseResValues
> Task :expo-dev-client:generateReleaseResources
> Task :expo-dev-client:packageReleaseResources
> Task :expo-constants:generateReleaseRFile
> Task :expo-dev-client:generateReleaseBuildConfig
> Task :expo-dev-menu:generateReleaseResValues
> Task :expo-constants:javaPreCompileRelease
> Task :expo-dev-menu-interface:generateReleaseResValues
> Task :expo-dev-menu-interface:generateReleaseResources
> Task :expo-dev-menu:generateReleaseResources
> Task :expo-dev-menu-interface:packageReleaseResources
> Task :expo-dev-menu-interface:parseReleaseLocalResources
> Task :expo-dev-menu:packageReleaseResources
> Task :expo-dev-client:dataBindingMergeDependencyArtifactsRelease
> Task :expo-json-utils:generateReleaseResValues
> Task :expo-json-utils:generateReleaseResources
> Task :expo-json-utils:packageReleaseResources
> Task :expo-json-utils:parseReleaseLocalResources
> Task :expo-dev-menu:parseReleaseLocalResources
> Task :expo-json-utils:generateReleaseRFile
> Task :expo-manifests:generateReleaseResValues
> Task :expo-manifests:generateReleaseResources
> Task :expo-manifests:packageReleaseResources
> Task :expo-dev-menu:generateReleaseRFile
> Task :expo-updates-interface:generateReleaseResValues
> Task :expo-dev-client:parseReleaseLocalResources
> Task :expo-updates-interface:generateReleaseResources
> Task :expo-updates-interface:packageReleaseResources
> Task :expo-manifests:parseReleaseLocalResources
> Task :expo-updates-interface:parseReleaseLocalResources
> Task :expo-dev-client:javaPreCompileRelease
> Task :expo-dev-menu:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-dev-menu-interface:generateReleaseRFile
> Task :expo-dev-menu-interface:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-dev-menu:generateReleaseBuildConfig
> Task :expo-json-utils:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-manifests:generateReleaseRFile
> Task :expo-manifests:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-dev-menu-interface:generateReleaseBuildConfig
> Task :expo-json-utils:generateReleaseBuildConfig
> Task :expo-manifests:generateReleaseBuildConfig
> Task :expo-updates-interface:generateReleaseRFile
> Task :expo-manifests:javaPreCompileRelease
> Task :expo-updates-interface:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-updates-interface:generateReleaseBuildConfig
> Task :expo-dev-menu-interface:javaPreCompileRelease
> Task :expo-updates-interface:javaPreCompileRelease
> Task :expo-dev-menu:javaPreCompileRelease
> Task :expo:javaPreCompileRelease
> Task :expo-json-utils:javaPreCompileRelease
> Task :expo-dev-client:dataBindingGenBaseClassesRelease
> Task :expo:writeReleaseAarMetadata
> Task :expo-dev-client:generateReleaseRFile
> Task :expo-dev-menu-interface:writeReleaseAarMetadata
> Task :expo-constants:writeReleaseAarMetadata
> Task :expo-json-utils:writeReleaseAarMetadata
> Task :expo-manifests:writeReleaseAarMetadata
> Task :react-native-screens:buildCMakeRelWithDebInfo[arm64-v8a]
> Task :react-native-async-storage_async-storage:writeReleaseAarMetadata
> Task :expo-dev-client:writeReleaseAarMetadata
> Task :expo-updates-interface:writeReleaseAarMetadata
> Task :expo-dev-launcher:generateReleaseResValues
> Task :expo-dev-menu:writeReleaseAarMetadata
> Task :react-native-community_datetimepicker:writeReleaseAarMetadata
> Task :expo-dev-launcher:dataBindingMergeDependencyArtifactsRelease
> Task :react-native-gesture-handler:writeReleaseAarMetadata
> Task :react-native-safe-area-context:writeReleaseAarMetadata
> Task :expo-dev-launcher:generateReleaseResources
> Task :react-native-maps:writeReleaseAarMetadata
> Task :expo-dev-client:extractDeepLinksRelease
> Task :expo-constants:extractDeepLinksRelease
> Task :expo:extractDeepLinksRelease
> Task :react-native-webview:writeReleaseAarMetadata
> Task :expo-dev-menu:extractDeepLinksRelease
> Task :expo-dev-launcher:packageReleaseResources
> Task :expo-dev-launcher:parseReleaseLocalResources
> Task :expo-constants:processReleaseManifest
> Task :expo-dev-client:processReleaseManifest
> Task :expo:processReleaseManifest
> Task :expo-json-utils:extractDeepLinksRelease
> Task :expo-dev-menu-interface:extractDeepLinksRelease
> Task :expo-manifests:extractDeepLinksRelease
> Task :expo-json-utils:processReleaseManifest
> Task :expo-updates-interface:extractDeepLinksRelease
> Task :expo-manifests:processReleaseManifest
> Task :react-native-async-storage_async-storage:extractDeepLinksRelease
> Task :react-native-async-storage_async-storage:processReleaseManifest
package="com.reactnativecommunity.asyncstorage" found in source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/@react-native-async-storage/async-storage/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="com.reactnativecommunity.asyncstorage" from the source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/@react-native-async-storage/async-storage/android/src/main/AndroidManifest.xml.
> Task :expo-dev-menu-interface:processReleaseManifest
> Task :expo-updates-interface:processReleaseManifest
> Task :expo-dev-menu:processReleaseManifest
> Task :react-native-gesture-handler:extractDeepLinksRelease
> Task :react-native-community_datetimepicker:extractDeepLinksRelease
> Task :react-native-safe-area-context:extractDeepLinksRelease
> Task :react-native-maps:extractDeepLinksRelease
> Task :react-native-gesture-handler:processReleaseManifest
> Task :react-native-safe-area-context:processReleaseManifest
package="com.th3rdwave.safeareacontext" found in source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/react-native-safe-area-context/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="com.th3rdwave.safeareacontext" from the source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/react-native-safe-area-context/android/src/main/AndroidManifest.xml.
> Task :react-native-community_datetimepicker:processReleaseManifest
> Task :react-native-maps:processReleaseManifest
> Task :react-native-webview:extractDeepLinksRelease
> Task :react-native-webview:processReleaseManifest
> Task :react-native-screens:configureCMakeRelWithDebInfo[armeabi-v7a]
> Task :expo-dev-launcher:dataBindingGenBaseClassesRelease
> Task :expo-dev-launcher:generateReleaseBuildConfig
> Task :expo-dev-launcher:generateReleaseRFile
> Task :app:checkReleaseDuplicateClasses
> Task :expo-dev-launcher:checkApolloVersions
> Task :app:buildKotlinToolingMetadata
> Task :app:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-dev-launcher:generateServiceApolloOptions
> Task :app:generateReleaseBuildConfig
> Task :expo:compileReleaseLibraryResources
> Task :expo-dev-client:compileReleaseLibraryResources
> Task :expo-constants:compileReleaseLibraryResources
> Task :expo-dev-menu-interface:compileReleaseLibraryResources
> Task :expo-json-utils:compileReleaseLibraryResources
> Task :expo-manifests:compileReleaseLibraryResources
> Task :react-native-async-storage_async-storage:compileReleaseLibraryResources
> Task :expo-updates-interface:compileReleaseLibraryResources
> Task :react-native-gesture-handler:compileReleaseLibraryResources
> Task :react-native-maps:compileReleaseLibraryResources
> Task :react-native-community_datetimepicker:compileReleaseLibraryResources
> Task :react-native-safe-area-context:compileReleaseLibraryResources
> Task :expo-dev-menu:compileReleaseLibraryResources
> Task :expo-dev-launcher:javaPreCompileRelease
> Task :react-native-webview:compileReleaseLibraryResources
> Task :expo-dev-launcher:writeReleaseAarMetadata
> Task :expo-dev-launcher:extractDeepLinksRelease
> Task :react-native-async-storage_async-storage:bundleLibCompileToJarRelease
> Task :react-native-community_datetimepicker:bundleLibCompileToJarRelease
> Task :react-native-gesture-handler:bundleLibCompileToJarRelease
> Task :expo-dev-launcher:processReleaseManifest
> Task :react-native-maps:bundleLibCompileToJarRelease
> Task :react-native-webview:bundleLibCompileToJarRelease
> Task :expo-dev-launcher:compileReleaseLibraryResources
> Task :expo:prepareReleaseArtProfile
> Task :react-native-safe-area-context:bundleLibCompileToJarRelease
> Task :expo-constants:prepareReleaseArtProfile
> Task :expo-dev-menu:prepareReleaseArtProfile
> Task :expo-dev-menu-interface:prepareReleaseArtProfile
> Task :expo-dev-client:prepareReleaseArtProfile
> Task :expo-dev-launcher:prepareReleaseArtProfile
> Task :expo-json-utils:prepareReleaseArtProfile
> Task :expo-manifests:prepareReleaseArtProfile
> Task :react-native-community_datetimepicker:prepareReleaseArtProfile
> Task :expo-updates-interface:prepareReleaseArtProfile
> Task :react-native-async-storage_async-storage:prepareReleaseArtProfile
> Task :react-native-maps:prepareReleaseArtProfile
> Task :react-native-gesture-handler:prepareReleaseArtProfile
> Task :react-native-webview:prepareReleaseArtProfile
> Task :react-native-safe-area-context:prepareReleaseArtProfile
> Task :react-native-community_datetimepicker:bundleLibRuntimeToJarRelease
> Task :react-native-safe-area-context:bundleLibRuntimeToJarRelease
> Task :react-native-gesture-handler:bundleLibRuntimeToJarRelease
> Task :react-native-maps:bundleLibRuntimeToJarRelease
> Task :react-native-webview:bundleLibRuntimeToJarRelease
> Task :react-native-async-storage_async-storage:bundleLibRuntimeToJarRelease
> Task :expo:mergeReleaseShaders
> Task :expo:compileReleaseShaders NO-SOURCE
> Task :expo:generateReleaseAssets UP-TO-DATE
> Task :expo:mergeReleaseAssets
> Task :expo-constants:mergeReleaseShaders
> Task :expo-constants:compileReleaseShaders NO-SOURCE
> Task :expo-constants:generateReleaseAssets UP-TO-DATE
> Task :expo-constants:mergeReleaseAssets
> Task :expo-dev-client:mergeReleaseShaders
> Task :expo-dev-client:compileReleaseShaders NO-SOURCE
> Task :expo-dev-client:generateReleaseAssets UP-TO-DATE
> Task :expo-dev-client:mergeReleaseAssets
> Task :expo-dev-launcher:mergeReleaseShaders
> Task :expo-dev-launcher:compileReleaseShaders NO-SOURCE
> Task :expo-dev-launcher:generateReleaseAssets UP-TO-DATE
> Task :expo-dev-launcher:mergeReleaseAssets
> Task :expo-dev-menu:mergeReleaseShaders
> Task :expo-dev-menu:compileReleaseShaders NO-SOURCE
> Task :expo-dev-menu:generateReleaseAssets UP-TO-DATE
> Task :expo-dev-menu:mergeReleaseAssets
> Task :expo-dev-menu-interface:mergeReleaseShaders
> Task :expo-dev-menu-interface:compileReleaseShaders NO-SOURCE
> Task :expo-dev-menu-interface:generateReleaseAssets UP-TO-DATE
> Task :expo-dev-menu-interface:mergeReleaseAssets
> Task :expo-json-utils:mergeReleaseShaders
> Task :expo-json-utils:compileReleaseShaders NO-SOURCE
> Task :expo-json-utils:generateReleaseAssets UP-TO-DATE
> Task :expo-json-utils:mergeReleaseAssets
> Task :expo-manifests:mergeReleaseShaders
> Task :expo-manifests:compileReleaseShaders NO-SOURCE
> Task :expo-manifests:generateReleaseAssets UP-TO-DATE
> Task :expo-manifests:mergeReleaseAssets
> Task :expo-updates-interface:mergeReleaseShaders
> Task :expo-updates-interface:compileReleaseShaders NO-SOURCE
> Task :expo-updates-interface:generateReleaseAssets UP-TO-DATE
> Task :expo-updates-interface:mergeReleaseAssets
> Task :react-native-async-storage_async-storage:mergeReleaseShaders
> Task :react-native-async-storage_async-storage:compileReleaseShaders NO-SOURCE
> Task :react-native-async-storage_async-storage:generateReleaseAssets UP-TO-DATE
> Task :react-native-async-storage_async-storage:mergeReleaseAssets
> Task :react-native-community_datetimepicker:mergeReleaseShaders
> Task :react-native-community_datetimepicker:compileReleaseShaders NO-SOURCE
> Task :react-native-community_datetimepicker:generateReleaseAssets UP-TO-DATE
> Task :react-native-community_datetimepicker:mergeReleaseAssets
> Task :react-native-gesture-handler:mergeReleaseShaders
> Task :expo-dev-launcher:generateServiceApolloSources
w: /home/expo/workingdir/build/node_modules/expo-dev-launcher/android/src/main/graphql/GetBranches.graphql: (21, 11): Apollo: Use of deprecated field `runtimeVersion`
w: /home/expo/workingdir/build/node_modules/expo-dev-launcher/android/src/main/graphql/GetBranches.graphql: (34, 3): Apollo: Variable `platform` is unused
w: /home/expo/workingdir/build/node_modules/expo-dev-launcher/android/src/main/graphql/GetUpdates.graphql: (14, 11): Apollo: Use of deprecated field `runtimeVersion`
> Task :react-native-gesture-handler:compileReleaseShaders NO-SOURCE
> Task :react-native-gesture-handler:generateReleaseAssets UP-TO-DATE
> Task :react-native-gesture-handler:mergeReleaseAssets
> Task :react-native-maps:mergeReleaseShaders
> Task :react-native-maps:compileReleaseShaders NO-SOURCE
> Task :react-native-maps:generateReleaseAssets UP-TO-DATE
> Task :react-native-maps:mergeReleaseAssets
> Task :react-native-safe-area-context:mergeReleaseShaders
> Task :react-native-safe-area-context:compileReleaseShaders NO-SOURCE
> Task :react-native-safe-area-context:generateReleaseAssets UP-TO-DATE
> Task :react-native-safe-area-context:mergeReleaseAssets
> Task :react-native-webview:mergeReleaseShaders
> Task :react-native-webview:compileReleaseShaders NO-SOURCE
> Task :react-native-webview:generateReleaseAssets UP-TO-DATE
> Task :expo:extractProguardFiles
> Task :react-native-webview:mergeReleaseAssets
> Task :expo-constants:extractProguardFiles
> Task :expo-dev-client:extractProguardFiles
> Task :expo-dev-client:prepareLintJarForPublish
> Task :expo-constants:prepareLintJarForPublish
> Task :expo-dev-launcher:extractProguardFiles
> Task :expo-dev-menu:extractProguardFiles
> Task :expo-dev-menu-interface:extractProguardFiles
> Task :expo-dev-menu-interface:prepareLintJarForPublish
> Task :expo-json-utils:extractProguardFiles
> Task :expo-manifests:extractProguardFiles
> Task :expo-json-utils:prepareLintJarForPublish
> Task :expo-manifests:prepareLintJarForPublish
> Task :expo-dev-menu:prepareLintJarForPublish
> Task :expo-dev-launcher:prepareLintJarForPublish
> Task :expo-updates-interface:extractProguardFiles
> Task :expo:prepareLintJarForPublish
> Task :react-native-async-storage_async-storage:processReleaseJavaRes NO-SOURCE
> Task :react-native-async-storage_async-storage:createFullJarRelease
> Task :expo-updates-interface:prepareLintJarForPublish
> Task :react-native-community_datetimepicker:processReleaseJavaRes
> Task :react-native-async-storage_async-storage:extractProguardFiles
> Task :react-native-community_datetimepicker:createFullJarRelease
> Task :react-native-community_datetimepicker:extractProguardFiles
> Task :react-native-gesture-handler:processReleaseJavaRes
> Task :react-native-gesture-handler:createFullJarRelease
> Task :react-native-gesture-handler:extractProguardFiles
> Task :react-native-maps:processReleaseJavaRes NO-SOURCE
> Task :react-native-maps:createFullJarRelease
> Task :react-native-maps:extractProguardFiles
> Task :react-native-screens:buildCMakeRelWithDebInfo[armeabi-v7a]
> Task :app:createBundleReleaseJsAndAssets
Starting Metro Bundler
> Task :react-native-safe-area-context:processReleaseJavaRes
> Task :react-native-safe-area-context:createFullJarRelease
> Task :react-native-safe-area-context:extractProguardFiles
> Task :react-native-screens:configureCMakeRelWithDebInfo[x86]
> Task :app:createBundleReleaseJsAndAssets
Android ./index.ts ▓▓▓░░░░░░░░░░░░░ 21.6% (218/469)
> Task :react-native-screens:buildCMakeRelWithDebInfo[x86]
> Task :react-native-screens:configureCMakeRelWithDebInfo[x86_64]
> Task :app:createBundleReleaseJsAndAssets
Android ./index.ts ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░ 99.9% (1306/1306)
Android Bundled 5346ms index.ts (1306 modules)
Writing bundle output to: /home/expo/workingdir/build/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle
Writing sourcemap output to: /home/expo/workingdir/build/android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.packager.map
Copying 70 asset files
Done writing bundle output
Done writing sourcemap output
> Task :react-native-community_datetimepicker:generateReleaseLintModel
> Task :react-native-gesture-handler:generateReleaseLintModel
> Task :react-native-maps:generateReleaseLintModel
> Task :react-native-safe-area-context:generateReleaseLintModel
> Task :react-native-maps:prepareLintJarForPublish
> Task :react-native-safe-area-context:prepareLintJarForPublish
> Task :react-native-gesture-handler:prepareLintJarForPublish
> Task :react-native-community_datetimepicker:prepareLintJarForPublish
> Task :react-native-gesture-handler:stripReleaseDebugSymbols NO-SOURCE
> Task :react-native-community_datetimepicker:stripReleaseDebugSymbols NO-SOURCE
> Task :react-native-maps:stripReleaseDebugSymbols NO-SOURCE
> Task :react-native-async-storage_async-storage:generateReleaseLintModel
> Task :react-native-webview:processReleaseJavaRes
> Task :react-native-gesture-handler:copyReleaseJniLibsProjectAndLocalJars
> Task :react-native-maps:copyReleaseJniLibsProjectAndLocalJars
> Task :react-native-community_datetimepicker:extractDeepLinksForAarRelease
> Task :react-native-community_datetimepicker:copyReleaseJniLibsProjectAndLocalJars
> Task :react-native-gesture-handler:extractDeepLinksForAarRelease
> Task :react-native-maps:extractDeepLinksForAarRelease
> Task :react-native-async-storage_async-storage:prepareLintJarForPublish
> Task :react-native-safe-area-context:stripReleaseDebugSymbols NO-SOURCE
> Task :react-native-webview:createFullJarRelease
> Task :react-native-webview:extractProguardFiles
> Task :react-native-safe-area-context:copyReleaseJniLibsProjectAndLocalJars
> Task :react-native-safe-area-context:extractDeepLinksForAarRelease
> Task :react-native-webview:generateReleaseLintModel
> Task :react-native-webview:prepareLintJarForPublish
> Task :react-native-webview:stripReleaseDebugSymbols NO-SOURCE
> Task :react-native-webview:copyReleaseJniLibsProjectAndLocalJars
> Task :react-native-webview:extractDeepLinksForAarRelease
> Task :react-native-screens:buildCMakeRelWithDebInfo[x86_64]
> Task :react-native-screens:mergeReleaseJniLibFolders
> Task :react-native-screens:mergeReleaseNativeLibs
> Task :react-native-screens:copyReleaseJniLibsProjectOnly
> Task :react-native-screens:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :react-native-screens:generateReleaseBuildConfig
> Task :react-native-screens:generateReleaseResValues
> Task :react-native-screens:generateReleaseResources
> Task :react-native-screens:packageReleaseResources
> Task :react-native-screens:parseReleaseLocalResources
> Task :react-native-screens:generateReleaseRFile
> Task :expo-modules-core:buildCMakeRelWithDebInfo[arm64-v8a]
> Task :expo-modules-core:configureCMakeRelWithDebInfo[armeabi-v7a]
> Task :react-native-community_datetimepicker:extractReleaseAnnotations
> Task :react-native-safe-area-context:extractReleaseAnnotations
> Task :react-native-webview:extractReleaseAnnotations
> Task :react-native-maps:extractReleaseAnnotations
> Task :react-native-community_datetimepicker:mergeReleaseGeneratedProguardFiles
> Task :react-native-maps:mergeReleaseGeneratedProguardFiles
> Task :react-native-safe-area-context:mergeReleaseGeneratedProguardFiles
> Task :react-native-screens:javaPreCompileRelease
> Task :react-native-gesture-handler:extractReleaseAnnotations
> Task :react-native-community_datetimepicker:mergeReleaseConsumerProguardFiles
> Task :react-native-screens:writeReleaseAarMetadata
> Task :react-native-maps:mergeReleaseConsumerProguardFiles
> Task :react-native-gesture-handler:mergeReleaseGeneratedProguardFiles
> Task :react-native-safe-area-context:mergeReleaseConsumerProguardFiles
> Task :react-native-screens:extractDeepLinksRelease
> Task :react-native-gesture-handler:mergeReleaseConsumerProguardFiles
> Task :react-native-screens:processReleaseManifest
> Task :react-native-safe-area-context:mergeReleaseJavaResource
> Task :react-native-maps:mergeReleaseJavaResource
> Task :react-native-gesture-handler:mergeReleaseJavaResource
> Task :react-native-community_datetimepicker:mergeReleaseJavaResource
> Task :react-native-screens:prepareReleaseArtProfile
> Task :react-native-screens:compileReleaseLibraryResources
> Task :react-native-screens:mergeReleaseShaders
> Task :react-native-screens:compileReleaseShaders NO-SOURCE
> Task :react-native-screens:generateReleaseAssets UP-TO-DATE
> Task :react-native-screens:mergeReleaseAssets
> Task :react-native-community_datetimepicker:syncReleaseLibJars
> Task :react-native-screens:extractProguardFiles
> Task :react-native-safe-area-context:syncReleaseLibJars
> Task :react-native-screens:prepareLintJarForPublish
> Task :react-native-safe-area-context:bundleReleaseLocalLintAar
> Task :react-native-community_datetimepicker:bundleReleaseLocalLintAar
> Task :react-native-screens:extractDeepLinksForAarRelease
> Task :react-native-webview:mergeReleaseGeneratedProguardFiles
> Task :react-native-async-storage_async-storage:stripReleaseDebugSymbols NO-SOURCE
> Task :react-native-webview:mergeReleaseConsumerProguardFiles
> Task :react-native-gesture-handler:syncReleaseLibJars
> Task :react-native-maps:syncReleaseLibJars
> Task :react-native-gesture-handler:bundleReleaseLocalLintAar
> Task :react-native-maps:bundleReleaseLocalLintAar
> Task :react-native-async-storage_async-storage:extractDeepLinksForAarRelease
> Task :expo:stripReleaseDebugSymbols NO-SOURCE
> Task :react-native-async-storage_async-storage:copyReleaseJniLibsProjectAndLocalJars
> Task :react-native-webview:mergeReleaseJavaResource
> Task :expo-dev-launcher:stripReleaseDebugSymbols NO-SOURCE
> Task :expo:extractDeepLinksForAarRelease
> Task :expo:copyReleaseJniLibsProjectAndLocalJars
> Task :expo-dev-menu:stripReleaseDebugSymbols NO-SOURCE
> Task :react-native-async-storage_async-storage:extractReleaseAnnotations
> Task :expo-dev-launcher:copyReleaseJniLibsProjectAndLocalJars
> Task :react-native-screens:stripReleaseDebugSymbols
> Task :expo-dev-launcher:extractDeepLinksForAarRelease
> Task :react-native-screens:copyReleaseJniLibsProjectAndLocalJars
> Task :react-native-async-storage_async-storage:mergeReleaseGeneratedProguardFiles
> Task :expo-dev-menu:copyReleaseJniLibsProjectAndLocalJars
> Task :expo-dev-menu-interface:stripReleaseDebugSymbols NO-SOURCE
> Task :expo-constants:stripReleaseDebugSymbols NO-SOURCE
> Task :expo-dev-menu:extractDeepLinksForAarRelease
> Task :react-native-webview:syncReleaseLibJars
> Task :expo-dev-client:stripReleaseDebugSymbols NO-SOURCE
> Task :react-native-async-storage_async-storage:mergeReleaseConsumerProguardFiles
> Task :expo-dev-menu-interface:copyReleaseJniLibsProjectAndLocalJars
> Task :expo-constants:copyReleaseJniLibsProjectAndLocalJars
> Task :react-native-webview:bundleReleaseLocalLintAar
> Task :expo-constants:extractDeepLinksForAarRelease
> Task :expo-dev-menu-interface:extractDeepLinksForAarRelease
> Task :expo-manifests:stripReleaseDebugSymbols NO-SOURCE
> Task :expo-dev-client:copyReleaseJniLibsProjectAndLocalJars
> Task :react-native-async-storage_async-storage:mergeReleaseJavaResource
> Task :expo-dev-client:extractDeepLinksForAarRelease
> Task :expo-json-utils:stripReleaseDebugSymbols NO-SOURCE
> Task :expo-manifests:copyReleaseJniLibsProjectAndLocalJars
> Task :expo-manifests:extractDeepLinksForAarRelease
> Task :expo-updates-interface:stripReleaseDebugSymbols NO-SOURCE
> Task :expo-json-utils:copyReleaseJniLibsProjectAndLocalJars
> Task :expo-updates-interface:copyReleaseJniLibsProjectAndLocalJars
> Task :expo-json-utils:extractDeepLinksForAarRelease
> Task :expo-constants:writeReleaseLintModelMetadata
> Task :expo-dev-client:writeReleaseLintModelMetadata
> Task :react-native-async-storage_async-storage:syncReleaseLibJars
> Task :expo-updates-interface:extractDeepLinksForAarRelease
> Task :expo-dev-launcher:writeReleaseLintModelMetadata
> Task :expo-dev-menu-interface:writeReleaseLintModelMetadata
> Task :expo-json-utils:writeReleaseLintModelMetadata
> Task :expo-manifests:writeReleaseLintModelMetadata
> Task :react-native-async-storage_async-storage:bundleReleaseLocalLintAar
> Task :expo-updates-interface:writeReleaseLintModelMetadata
> Task :expo-dev-menu:writeReleaseLintModelMetadata
> Task :expo:writeReleaseLintModelMetadata
> Task :app:generateReleaseResValues
> Task :app:generateReleaseResources
> Task :app:packageReleaseResources
> Task :app:parseReleaseLocalResources
> Task :app:createReleaseCompatibleScreenManifests
> Task :app:extractDeepLinksRelease
> Task :app:javaPreCompileRelease
> Task :app:desugarReleaseFileDependencies
> Task :app:mergeReleaseStartupProfile
> Task :react-native-screens:compileReleaseKotlin
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/RNScreensPackage.kt:56:9 The corresponding parameter in the supertype 'BaseReactPackage' is named 'name'. This may cause problems when calling this function with named arguments.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/RNScreensPackage.kt:57:9 The corresponding parameter in the supertype 'BaseReactPackage' is named 'reactContext'. This may cause problems when calling this function with named arguments.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/RNScreensPackage.kt:70:17 'constructor(name: String, className: String, canOverrideExistingModule: Boolean, needsEagerInit: Boolean, hasConstants: Boolean, isCxxModule: Boolean, isTurboModule: Boolean): ReactModuleInfo' is deprecated. This constructor is deprecated and will be removed in the future. Use ReactModuleInfo(String, String, boolean, boolean, boolean, boolean)].
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/Screen.kt:48:77 Unchecked cast of '(CoordinatorLayout.Behavior<View!>?..CoordinatorLayout.Behavior<*>?)' to 'BottomSheetBehavior<Screen>'.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/Screen.kt:383:36 'fun setTranslucent(screen: Screen, activity: Activity?, context: ReactContext?): Unit' is deprecated. For apps targeting SDK 35 or above this prop has no effect because edge-to-edge is enabled by default and the status bar is always translucent.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/Screen.kt:402:36 'fun setColor(screen: Screen, activity: Activity?, context: ReactContext?): Unit' is deprecated. For apps targeting SDK 35 or above this prop has no effect because edge-to-edge is enabled by default and the status bar is always translucent.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/Screen.kt:420:36 'fun setNavigationBarColor(screen: Screen, activity: Activity?): Unit' is deprecated. For all apps targeting Android SDK 35 or above edge-to-edge is enabled by default.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/Screen.kt:437:36 'fun setNavigationBarTranslucent(screen: Screen, activity: Activity?): Unit' is deprecated. For all apps targeting Android SDK 35 or above edge-to-edge is enabled by default.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStackFragment.kt:217:31 'var targetElevation: Float' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStackFragment.kt:220:13 'fun setHasOptionsMenu(p0: Boolean): Unit' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStackFragment.kt:397:18 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStackFragment.kt:404:22 'fun onPrepareOptionsMenu(p0: Menu): Unit' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStackFragment.kt:407:18 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStackFragment.kt:412:22 'fun onCreateOptionsMenu(p0: Menu, p1: MenuInflater): Unit' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStackHeaderConfig.kt:435:18 'val reactNativeHost: ReactNativeHost' is deprecated. You should not use ReactNativeHost directly in the New Architecture. Use ReactHost instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenViewManager.kt:203:14 'var statusBarColor: Int?' is deprecated. For apps targeting SDK 35 or above this prop has no effect because edge-to-edge is enabled by default and the status bar is always translucent.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenViewManager.kt:220:14 'var isStatusBarTranslucent: Boolean?' is deprecated. For apps targeting SDK 35 or above this prop has no effect because edge-to-edge is enabled by default and the status bar is always translucent.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenViewManager.kt:237:14 'var navigationBarColor: Int?' is deprecated. For all apps targeting Android SDK 35 or above edge-to-edge is enabled by default.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenViewManager.kt:246:14 'var isNavigationBarTranslucent: Boolean?' is deprecated. For all apps targeting Android SDK 35 or above edge-to-edge is enabled by default.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:55:42 'fun replaceSystemWindowInsets(p0: Int, p1: Int, p2: Int, p3: Int): WindowInsetsCompat' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:56:39 'val systemWindowInsetLeft: Int' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:58:39 'val systemWindowInsetRight: Int' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:59:39 'val systemWindowInsetBottom: Int' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:102:53 'var statusBarColor: Int' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:106:37 'var statusBarColor: Int?' is deprecated. For apps targeting SDK 35 or above this prop has no effect because edge-to-edge is enabled by default and the status bar is always translucent.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:113:48 'var statusBarColor: Int' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:116:32 'var statusBarColor: Int' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:162:49 'var isStatusBarTranslucent: Boolean?' is deprecated. For apps targeting SDK 35 or above this prop has no effect because edge-to-edge is enabled by default and the status bar is always translucent.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:218:43 'var navigationBarColor: Int?' is deprecated. For all apps targeting Android SDK 35 or above edge-to-edge is enabled by default.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:218:72 'var navigationBarColor: Int' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:224:16 'var navigationBarColor: Int' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:241:55 'var isNavigationBarTranslucent: Boolean?' is deprecated. For all apps targeting Android SDK 35 or above edge-to-edge is enabled by default.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:283:13 'fun setColor(screen: Screen, activity: Activity?, context: ReactContext?): Unit' is deprecated. For apps targeting SDK 35 or above this prop has no effect because edge-to-edge is enabled by default and the status bar is always translucent.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:285:13 'fun setTranslucent(screen: Screen, activity: Activity?, context: ReactContext?): Unit' is deprecated. For apps targeting SDK 35 or above this prop has no effect because edge-to-edge is enabled by default and the status bar is always translucent.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:289:13 'fun setNavigationBarColor(screen: Screen, activity: Activity?): Unit' is deprecated. For all apps targeting Android SDK 35 or above edge-to-edge is enabled by default.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:290:13 'fun setNavigationBarTranslucent(screen: Screen, activity: Activity?): Unit' is deprecated. For all apps targeting Android SDK 35 or above edge-to-edge is enabled by default.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:354:42 'var statusBarColor: Int?' is deprecated. For apps targeting SDK 35 or above this prop has no effect because edge-to-edge is enabled by default and the status bar is always translucent.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:356:48 'var isStatusBarTranslucent: Boolean?' is deprecated. For apps targeting SDK 35 or above this prop has no effect because edge-to-edge is enabled by default and the status bar is always translucent.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:359:57 'var navigationBarColor: Int?' is deprecated. For all apps targeting Android SDK 35 or above edge-to-edge is enabled by default.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:360:63 'var isNavigationBarTranslucent: Boolean?' is deprecated. For all apps targeting Android SDK 35 or above edge-to-edge is enabled by default.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/BottomSheetDialogRootView.kt:7:8 'object ReactFeatureFlags : Any' is deprecated. Use com.facebook.react.internal.featureflags.ReactNativeFeatureFlags instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/BottomSheetDialogRootView.kt:25:13 'object ReactFeatureFlags : Any' is deprecated. Use com.facebook.react.internal.featureflags.ReactNativeFeatureFlags instead.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/BottomSheetDialogRootView.kt:32:9 The corresponding parameter in the supertype 'ReactViewGroup' is named 'left'. This may cause problems when calling this function with named arguments.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/BottomSheetDialogRootView.kt:33:9 The corresponding parameter in the supertype 'ReactViewGroup' is named 'top'. This may cause problems when calling this function with named arguments.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/BottomSheetDialogRootView.kt:34:9 The corresponding parameter in the supertype 'ReactViewGroup' is named 'right'. This may cause problems when calling this function with named arguments.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/BottomSheetDialogRootView.kt:35:9 The corresponding parameter in the supertype 'ReactViewGroup' is named 'bottom'. This may cause problems when calling this function with named arguments.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/BottomSheetDialogRootView.kt:71:9 The corresponding parameter in the supertype 'RootView' is named 'childView'. This may cause problems when calling this function with named arguments.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/BottomSheetDialogRootView.kt:72:9 The corresponding parameter in the supertype 'RootView' is named 'ev'. This may cause problems when calling this function with named arguments.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/BottomSheetDialogRootView.kt:79:46 The corresponding parameter in the supertype 'RootView' is named 'ev'. This may cause problems when calling this function with named arguments.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/BottomSheetDialogRootView.kt:83:9 The corresponding parameter in the supertype 'RootView' is named 'childView'. This may cause problems when calling this function with named arguments.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/BottomSheetDialogRootView.kt:84:9 The corresponding parameter in the supertype 'RootView' is named 'ev'. This may cause problems when calling this function with named arguments.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/BottomSheetDialogRootView.kt:95:34 The corresponding parameter in the supertype 'RootView' is named 't'. This may cause problems when calling this function with named arguments.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/DimmingView.kt:63:9 The corresponding parameter in the supertype 'ReactCompoundView' is named 'touchX'. This may cause problems when calling this function with named arguments.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/DimmingView.kt:64:9 The corresponding parameter in the supertype 'ReactCompoundView' is named 'touchY'. This may cause problems when calling this function with named arguments.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/DimmingView.kt:68:9 The corresponding parameter in the supertype 'ReactCompoundViewGroup' is named 'touchX'. This may cause problems when calling this function with named arguments.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/DimmingView.kt:69:9 The corresponding parameter in the supertype 'ReactCompoundViewGroup' is named 'touchY'. This may cause problems when calling this function with named arguments.
w: file:///home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/gamma/tabs/TabsHostViewManager.kt:37:9 The corresponding parameter in the supertype 'TabsHostViewManager' is named 'view'. This may cause problems when calling this function with named arguments.
> Task :expo-modules-core:buildCMakeRelWithDebInfo[armeabi-v7a]
> Task :expo-modules-core:configureCMakeRelWithDebInfo[x86]
> Task :react-native-safe-area-context:lintVitalAnalyzeRelease
> Task :react-native-async-storage_async-storage:writeReleaseLintModelMetadata
> Task :react-native-community_datetimepicker:writeReleaseLintModelMetadata
> Task :react-native-gesture-handler:writeReleaseLintModelMetadata
> Task :react-native-maps:writeReleaseLintModelMetadata
> Task :react-native-safe-area-context:writeReleaseLintModelMetadata
> Task :react-native-screens:writeReleaseLintModelMetadata
> Task :react-native-maps:lintVitalAnalyzeRelease
> Task :react-native-webview:writeReleaseLintModelMetadata
> Task :react-native-async-storage_async-storage:generateReleaseLintVitalModel
> Task :react-native-community_datetimepicker:generateReleaseLintVitalModel
> Task :react-native-gesture-handler:generateReleaseLintVitalModel
> Task :react-native-maps:generateReleaseLintVitalModel
> Task :react-native-safe-area-context:generateReleaseLintVitalModel
> Task :react-native-webview:generateReleaseLintVitalModel
> Task :expo-modules-core:buildCMakeRelWithDebInfo[x86]
> Task :react-native-async-storage_async-storage:lintVitalAnalyzeRelease
> Task :expo-modules-core:configureCMakeRelWithDebInfo[x86_64]
> Task :react-native-webview:lintVitalAnalyzeRelease
> Task :react-native-community_datetimepicker:lintVitalAnalyzeRelease
> Task :react-native-gesture-handler:lintVitalAnalyzeRelease
> Task :app:mergeExtDexRelease
> Task :expo-modules-core:buildCMakeRelWithDebInfo[x86_64]
> Task :expo-modules-core:mergeReleaseJniLibFolders
> Task :expo-modules-core:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-modules-core:generateReleaseBuildConfig
> Task :expo-modules-core:generateReleaseResValues
> Task :expo-modules-core:generateReleaseResources
> Task :expo-modules-core:packageReleaseResources
> Task :expo-modules-core:parseReleaseLocalResources
> Task :expo-modules-core:generateReleaseRFile
> Task :expo-modules-core:mergeReleaseNativeLibs
> Task :react-native-screens:compileReleaseJavaWithJavac
> Task :react-native-screens:processReleaseJavaRes
> Task :react-native-screens:bundleLibRuntimeToDirRelease
> Task :react-native-screens:bundleLibCompileToJarRelease
> Task :expo-modules-core:copyReleaseJniLibsProjectOnly
> Task :expo-modules-core:extractDeepLinksRelease
> Task :expo-modules-core:processReleaseManifest
/home/expo/workingdir/build/node_modules/expo-modules-core/android/src/main/AndroidManifest.xml:8:9-11:45 Warning:
	meta-data#com.facebook.soloader.enabled@android:value was tagged at AndroidManifest.xml:8 to replace other declarations but no other declaration present
> Task :expo-modules-core:writeReleaseAarMetadata
> Task :expo-modules-core:prepareReleaseArtProfile
> Task :expo-modules-core:javaPreCompileRelease
> Task :expo-modules-core:compileReleaseLibraryResources
> Task :expo-modules-core:mergeReleaseShaders
> Task :expo-modules-core:compileReleaseShaders NO-SOURCE
> Task :expo-modules-core:generateReleaseAssets UP-TO-DATE
> Task :expo-modules-core:mergeReleaseAssets
> Task :expo-modules-core:extractProguardFiles
> Task :expo-modules-core:extractDeepLinksForAarRelease
> Task :expo-modules-core:writeReleaseLintModelMetadata
> Task :expo-modules-core:prepareLintJarForPublish
> Task :react-native-screens:bundleLibRuntimeToJarRelease
> Task :react-native-screens:generateReleaseLintModel
> Task :react-native-screens:createFullJarRelease
> Task :react-native-screens:extractReleaseAnnotations
> Task :react-native-screens:mergeReleaseGeneratedProguardFiles
> Task :react-native-screens:mergeReleaseConsumerProguardFiles
> Task :expo-modules-core:stripReleaseDebugSymbols
> Task :expo-modules-core:copyReleaseJniLibsProjectAndLocalJars
> Task :react-native-screens:mergeReleaseJavaResource
> Task :react-native-screens:generateReleaseLintVitalModel
> Task :react-native-screens:syncReleaseLibJars
> Task :react-native-screens:bundleReleaseLocalLintAar
> Task :app:checkReleaseAarMetadata
> Task :app:mergeReleaseNativeLibs
> Task :app:mapReleaseSourceSetPaths
> Task :app:stripReleaseDebugSymbols
> Task :app:processReleaseMainManifest FAILED
See https://developer.android.com/r/studio-ui/build/manifest-merger for more information about the manifest merger.
/home/expo/workingdir/build/android/app/src/main/AndroidManifest.xml:18:62-100 Error:
	Attribute meta-data#com.google.android.geo.API_KEY@value at AndroidManifest.xml:18:62-100 requires a placeholder substitution but no value for <GOOGLE_MAPS_API_KEY> is provided.
/home/expo/workingdir/build/android/app/src/main/AndroidManifest.xml Error:
	Validation failed, exiting
> Task :app:extractReleaseNativeSymbolTables
> Task :app:mergeReleaseResources
> Task :expo-modules-core:compileReleaseKotlin
w: file:///home/expo/workingdir/build/node_modules/expo-modules-core/android/src/main/java/expo/modules/adapters/react/apploader/RNHeadlessAppLoader.kt:48:87 'val reactNativeHost: ReactNativeHost' is deprecated. You should not use ReactNativeHost directly in the New Architecture. Use ReactHost instead.
w: file:///home/expo/workingdir/build/node_modules/expo-modules-core/android/src/main/java/expo/modules/adapters/react/apploader/RNHeadlessAppLoader.kt:91:85 'val reactNativeHost: ReactNativeHost' is deprecated. You should not use ReactNativeHost directly in the New Architecture. Use ReactHost instead.
w: file:///home/expo/workingdir/build/node_modules/expo-modules-core/android/src/main/java/expo/modules/adapters/react/apploader/RNHeadlessAppLoader.kt:120:83 'val reactNativeHost: ReactNativeHost' is deprecated. You should not use ReactNativeHost directly in the New Architecture. Use ReactHost instead.
w: file:///home/expo/workingdir/build/node_modules/expo-modules-core/android/src/main/java/expo/modules/apploader/AppLoaderProvider.kt:34:52 Unchecked cast of 'Class<*>!' to 'Class<out HeadlessAppLoader>'.
w: file:///home/expo/workingdir/build/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/AppContext.kt:30:8 'typealias ErrorManagerModule = JSLoggerModule' is deprecated. Use JSLoggerModule instead.
w: file:///home/expo/workingdir/build/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/AppContext.kt:253:21 'typealias ErrorManagerModule = JSLoggerModule' is deprecated. Use JSLoggerModule instead.
w: file:///home/expo/workingdir/build/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/AppContext.kt:343:21 'val DEFAULT: Int' is deprecated. UIManagerType.DEFAULT will be deleted in the next release of React Native. Use [LEGACY] instead.
w: file:///home/expo/workingdir/build/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/defaultmodules/NativeModulesProxyModule.kt:16:5 'fun Constants(legacyConstantsProvider: () -> Map<String, Any?>): Unit' is deprecated. Use `Constant` or `Property` instead.
w: file:///home/expo/workingdir/build/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/jni/PromiseImpl.kt:65:51 'val errorManager: JSLoggerModule?' is deprecated. Use AppContext.jsLogger instead.
w: file:///home/expo/workingdir/build/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/jni/PromiseImpl.kt:69:22 'fun reportExceptionToLogBox(codedException: CodedException): Unit' is deprecated. Use appContext.jsLogger.error(...) instead.
w: file:///home/expo/workingdir/build/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/views/ViewDefinitionBuilder.kt:464:16 'val errorManager: JSLoggerModule?' is deprecated. Use AppContext.jsLogger instead.
w: file:///home/expo/workingdir/build/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/views/ViewDefinitionBuilder.kt:464:30 'fun reportExceptionToLogBox(codedException: CodedException): Unit' is deprecated. Use appContext.jsLogger.error(...) instead.
w: file:///home/expo/workingdir/build/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/views/ViewManagerDefinition.kt:41:16 'val errorManager: JSLoggerModule?' is deprecated. Use AppContext.jsLogger instead.
w: file:///home/expo/workingdir/build/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/views/ViewManagerDefinition.kt:41:30 'fun reportExceptionToLogBox(codedException: CodedException): Unit' is deprecated. Use appContext.jsLogger.error(...) instead.
> Task :react-native-screens:lintVitalAnalyzeRelease
[Incubating] Problems report is available at: file:///home/expo/workingdir/build/android/build/reports/problems/problems-report.html
Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.
You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.
For more on this, please refer to https://docs.gradle.org/8.14.3/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.
547 actionable tasks: 547 executed
FAILURE: Build failed with an exception.
* What went wrong:
Execution failed for task ':app:processReleaseMainManifest'.
> Manifest merger failed with multiple errors, see logs
* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.
BUILD FAILED in 3m 29s
Error: Gradle build failed with unknown error. See logs for the "Run gradlew" phase for more information.