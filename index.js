// Polyfill uygulamalarını başlatmadan önce kontrol fonksiyonu
function applyPolyfills() {
  console.log('Polyfills uygulanıyor...');

  // Symbol.asyncIterator polyfill
  if (typeof Symbol === 'function' && !Symbol.asyncIterator) {
    Symbol.asyncIterator = Symbol('Symbol.asyncIterator');
  }

  // UUID için crypto.getRandomValues polyfill
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    global.crypto = {
      getRandomValues: function(arr) {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }
    };
  }

  // ReadableStream ve Response için async iterable desteği
  if (typeof global !== 'undefined') {
    // Stream API için polyfill
    const streamPolyfill = () => {
      if (typeof global.ReadableStream !== 'undefined') {
        const originalReadableStream = global.ReadableStream;
        
        try {
          // ReadableStream örneği oluştur ve test et
          const testStream = new originalReadableStream({
            start(controller) {
              controller.close();
            }
          });
          
          // asyncIterator desteği var mı?
          if (testStream[Symbol.asyncIterator]) {
            console.log('ReadableStream asyncIterator zaten destekleniyor');
            return;
          }
        } catch (e) {
          console.log('ReadableStream test edilirken hata:', e);
        }
        
        // Global ReadableStream'i yeniden tanımla
        global.ReadableStream = function(...args) {
          const stream = new originalReadableStream(...args);
          
          // asyncIterator özelliği ekle
          if (!stream[Symbol.asyncIterator]) {
            stream[Symbol.asyncIterator] = async function*() {
              const reader = stream.getReader();
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) return;
                  yield value;
                }
              } finally {
                reader.releaseLock();
              }
            };
          }
          
          return stream;
        };
        
        // Prototip bağlantısını koru
        global.ReadableStream.prototype = originalReadableStream.prototype;
        
        console.log('ReadableStream polyfill uygulandı');
      }
    };

    // Response için polyfill
    const responsePolyfill = () => {
      if (typeof global.Response !== 'undefined') {
        const originalResponse = global.Response;
        
        try {
          // Response örneği oluştur ve test et
          const testResponse = new originalResponse();
          
          // body tanımlı olabilir veya olmayabilir
          if (testResponse.body && testResponse.body[Symbol.asyncIterator]) {
            console.log('Response.body asyncIterator zaten destekleniyor');
            return;
          }
        } catch (e) {
          console.log('Response test edilirken hata:', e);
        }
        
        // Global Response'u yeniden tanımla
        global.Response = function(...args) {
          const response = new originalResponse(...args);
          
          // Response.body stream için asyncIterator ekle
          if (response.body && !response.body[Symbol.asyncIterator]) {
            response.body[Symbol.asyncIterator] = async function*() {
              const reader = response.body.getReader();
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) return;
                  yield value;
                }
              } finally {
                reader.releaseLock();
              }
            };
          }
          
          return response;
        };
        
        // Prototip bağlantısını koru
        global.Response.prototype = originalResponse.prototype;
        
        console.log('Response polyfill uygulandı');
      }
    };

    // Iterator ve Promise için polyfill
    const iteratorPromisePolyfill = () => {
      // Herhangi bir nesne için Symbol.asyncIterator destek eklemesi
      if (!Object.prototype[Symbol.asyncIterator]) {
        Object.defineProperty(Object.prototype, Symbol.asyncIterator, {
          configurable: true,
          enumerable: false,
          writable: true,
          value: function() {
            const o = this;
            
            if (!o) return { 
              next: () => Promise.resolve({ done: true }) 
            };
            
            if (typeof o.next === 'function') {
              return this;
            }
            
            if (typeof o.then === 'function') {
              return {
                next: () => o.then(v => ({ value: v, done: false }))
                           .catch(e => { throw e; }),
                [Symbol.asyncIterator]() { return this; }
              };
            }
            
            // Varsayılan iterator
            return {
              next: () => Promise.resolve({ value: undefined, done: true }),
              [Symbol.asyncIterator]() { return this; }
            };
          }
        });
        
        console.log('Global asyncIterator polyfill uygulandı');
      }
      
      // Promise için asyncIterator
      if (!Promise.prototype[Symbol.asyncIterator]) {
        Object.defineProperty(Promise.prototype, Symbol.asyncIterator, {
          configurable: true,
          enumerable: false,
          writable: true,
          value: function() {
            let resolved = false;
            let value;
            let error;
            
            // Promise'i izle
            this.then(
              v => { resolved = true; value = v; },
              e => { resolved = true; error = e; }
            );
            
            return {
              next: () => {
                if (!resolved) {
                  return this.then(
                    v => ({ value: v, done: false }),
                    e => { throw e; }
                  );
                }
                
                if (error) throw error;
                return Promise.resolve({ value, done: false });
              },
              return: () => Promise.resolve({ done: true }),
              throw: e => Promise.reject(e),
              [Symbol.asyncIterator]() { return this; }
            };
          }
        });
        
        console.log('Promise asyncIterator polyfill uygulandı');
      }
    };

    // Fetch için özel polyfill
    const fetchPolyfill = () => {
      if (typeof global.fetch !== 'undefined') {
        const originalFetch = global.fetch;
        
        global.fetch = function(...args) {
          return originalFetch.apply(this, args)
            .then(response => {
              // Response.body üzerinde asyncIterator olduğundan emin ol
              if (response.body && !response.body[Symbol.asyncIterator]) {
                response.body[Symbol.asyncIterator] = async function*() {
                  const reader = response.body.getReader();
                  try {
                    while (true) {
                      const { done, value } = await reader.read();
                      if (done) return;
                      yield value;
                    }
                  } finally {
                    reader.releaseLock();
                  }
                };
              }
              return response;
            });
        };
        
        console.log('Fetch polyfill uygulandı');
      }
    };

    // Polyfill'leri uygula
    try {
      streamPolyfill();
      responsePolyfill();
      iteratorPromisePolyfill();
      fetchPolyfill();
    } catch (e) {
      console.error('Polyfill uygulanırken hata:', e);
    }
  }
}

// Polyfill'leri uygula
applyPolyfills();

// Expo Router entry point
import 'expo-router/entry';