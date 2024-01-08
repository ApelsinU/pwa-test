const staticCacheName = 's-app-v3'
const dynamicCacheName = 'd-app-v3'

self.addEventListener('install', async event => {
    const cache = await caches.open(staticCacheName)
    await cache.addAll([
        'index.html',
        'offline.html',
        '/js/app.js',
        '/css/styles.css'
    ])
})

self.addEventListener('activate', async event => {
    const cachesVersions = await caches.keys()

    await Promise.all(
        cachesVersions
            .filter(version => version !== staticCacheName)
            .filter(version => version !== dynamicCacheName)
            .map(version => caches.delete(version))
    )
})

self.addEventListener('fetch', event => {
    const {request} = event

    const url = new URL(request.url)

    if (url.origin === location.origin) {
        event.respondWith(cacheFirst(request))
    } else {
        event.respondWith(networkFirst(request))
    }
})

async function cacheFirst(request) {
    const cached = await caches.match(request)

    return cached ? cached : fetch(request)
}

async function networkFirst(request) {
    const cache = await caches.open(dynamicCacheName)
    try {
        const response = await fetch(request)
        await cache.put(request, response.clone())
        return response
    } catch (e) {
        const cached = await cache.match(request)
        return cached ? cached : await caches.match('/offline.html')
    }
}
