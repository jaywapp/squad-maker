def binding = new Binding([ext: [:]])
new GroovyShell(binding).evaluate(new File(args[0]))
def policy = binding.getVariable('ext').productionBuildPolicy
def rejects = { Closure action, String message ->
    try {
        action()
        assert false: 'Expected rejection: ' + message
    } catch (IllegalArgumentException error) {
        assert error.message.contains(message): error.message
    }
}

assert policy.approvedProductionIdentity == null
assert policy.adsMode(null) == 'test'
assert policy.adsMode('test') == 'test'
assert policy.adsMode('production') == 'production'
['', 'Production', 'true', ' test '].each { value ->
    rejects({ policy.adsMode(value) }, 'squadAdsMode')
}
assert !policy.underAge(null, 'test')
assert !policy.underAge('false', 'production')
assert policy.underAge('true', 'production')
rejects({ policy.underAge(null, 'production') }, 'explicit')
['', 'False', 'yes', '0', ' false '].each { value ->
    rejects({ policy.underAge(value, 'test') }, 'must be true or false')
    rejects({ policy.underAge(value, 'production') }, 'must be true or false')
}

def approved = [applicationId: 'com.example.approved', versionCode: 1, versionName: '1.0.0']
['debug', 'release'].each { buildType ->
    policy.validateVariant('preview', buildType, 'test', null)
    rejects({ policy.validateVariant('preview', buildType, 'production', approved) }, 'only for productionRelease')
    rejects({ policy.validateVariant('production', buildType, 'test', null) }, 'user approval')
    policy.validateVariant('production', buildType, 'test', approved)
}
rejects({ policy.validateVariant('production', 'debug', 'production', approved) }, 'only for productionRelease')
rejects({ policy.validateVariant('production', 'release', 'production', null) }, 'user approval')
policy.validateVariant('production', 'release', 'production', approved)
rejects({ policy.validateVariant('unknown', 'release', 'test', approved) }, 'Unsupported')

assert policy.previewVersionCode('97', null) == 1099
assert policy.previewVersionCode('98', '1100') == 1100
assert policy.previewVersionCode('96', '1098') == 1098
['0', '-1', '', null, 'abc'].each { count ->
    rejects({ policy.previewVersionCode(count, null) }, 'Full Git commit count')
}
rejects({ policy.previewVersionCode('95', null) }, 'exceed 1097')
['1097', '1098', '1100', '0', 'invalid'].each { value ->
    rejects({ policy.previewVersionCode('97', value) }, 'full Git commit count')
}
rejects({ policy.previewVersionCode('2100000000', null) }, 'exceed 1097')
assert policy.testAds.app == 'ca-app-pub-3940256099942544~3347511713'
assert policy.testAds.banner == 'ca-app-pub-3940256099942544/6300978111'
assert policy.testAds.interstitial == 'ca-app-pub-3940256099942544/1033173712'
assert policy.productionAds.app == 'ca-app-pub-3532115669945697~1919738204'
assert policy.productionAds.banner == 'ca-app-pub-3532115669945697/4481041102'
assert policy.productionAds.interstitial == 'ca-app-pub-3532115669945697/3966035787'
println 'Android build policy matrix passed'
