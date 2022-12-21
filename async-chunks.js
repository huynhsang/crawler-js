/**
 * Split array by chunk size
 *
 * @param [arr] The array
 * @param [chunkSize] The chunk size number
 * @returns {*[]}
 */
const chunks = (arr, chunkSize) => {
    let results = [];
    while (arr.length) results.push(arr.splice(0, chunkSize));
    return results;
};

/**
 * Async handling chunks
 *
 * @param [arr] The given array
 * @param [f] The function to return a promise
 * @param [concurrency] The concurrency number
 */
module.exports = (arr, f, concurrency) => {
    if (arr.length === 0) return Promise.resolve();
    return Promise.all([chunks(arr, concurrency).reduce(
        (acc, chunk) => acc.then(() => Promise.all(chunk.map(f))),
        Promise.resolve()
    )]);
};