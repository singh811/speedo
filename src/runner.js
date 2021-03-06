import { remote } from 'webdriverio'

import { getMetricParams, getThrottleNetworkParam, getThrottleCpuParam } from './utils'

export default async function runPerformanceTest (username, accessKey, argv, name, build, logDir) {
    const { site, platformName: platform, browserVersion: version, tunnelIdentifier, parentTunnel } = argv
    const metrics = getMetricParams(argv)
    const networkCondition = getThrottleNetworkParam(argv)
    const cpuRate = getThrottleCpuParam(argv)
    const sauceOptions = {
        name, build, extendedDebugging: true, capturePerformance: true,
        ...(tunnelIdentifier ? { tunnelIdentifier } : {}),
        ...(parentTunnel ? { parentTunnel } : {})
    }

    const browser = await remote({
        user: username,
        key: accessKey,
        region: argv.region,
        logLevel: 'trace',
        outputDir: logDir,
        capabilities: {
            browserName: 'chrome',
            platform,
            version,
            ...sauceOptions
        }
    })

    const sessionId = browser.sessionId

    await browser.throttleNetwork(networkCondition)
    await browser.execute('sauce:debug', {
        method: 'Emulation.setCPUThrottlingRate',
        params: { rate: cpuRate }
    })
    await browser.url(site)
    const result = await browser.assertPerformance(name, metrics)
    await browser.deleteSession()
    return { sessionId, result }
}
