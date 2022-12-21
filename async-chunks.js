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
module.exports = async (arr, f, concurrency) => {
    if (arr.length > 0) {
        const batches = chunks(arr, concurrency);
        for (const batch of batches) {
            await Promise.all(batch.map(f));
        }
    }
};