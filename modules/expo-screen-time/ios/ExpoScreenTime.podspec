Pod::Spec.new do |s|
  s.name           = 'ExpoScreenTime'
  s.version        = '0.0.1'
  s.summary        = 'Expo module for screen time / usage statistics'
  s.description    = 'Provides access to device screen time data on Android (UsageStatsManager) and iOS (stub for DeviceActivity).'
  s.author         = 'Brain Village'
  s.homepage       = 'https://github.com/brainvillage'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
end
