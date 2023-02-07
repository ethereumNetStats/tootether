//This code is refer to https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript.

const ofByte = (bytes: number, decimals: number = 2): string => {

    if (bytes === 0) return '0 B';
    if (typeof bytes != "number") throw new TypeError('Argument is not number.');
    if (bytes < 0) throw new RangeError('Argument is Negative number.');

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + units[i];

};

const ofHashRate = (hash: string | number, decimals: number = 2): string => {

    if (hash === 0) return '0';
    if (typeof hash != "number") throw new TypeError('Argument is not number.');
    if (hash < 0) throw new RangeError('Argument is Negative number.');

    const k = 1000;
    const dm = decimals < 0 ? 0 : decimals;
    const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s', 'ZH/s', 'YH/s'];

    const i = Math.floor(Math.log(hash) / Math.log(k));

    return parseFloat((hash / Math.pow(k, i)).toFixed(dm)) + ' ' + units[i];

};

const ofDiff = (number: number, decimals: number= 2): string => {

    if (number === 0) return '0';
    if (typeof number != "number") throw new TypeError('Argument is not number.');
    if (number < 0) throw new RangeError('Argument is Negative number.');

    const k = 1000;
    const dm = decimals < 0 ? 0 : decimals;
    const units = ['H', 'KH', 'MH', 'GH', 'TH', 'PH', 'EH', 'ZH', 'YH'];

    const i = Math.floor(Math.log(number) / Math.log(k));

    return parseFloat((number / Math.pow(k, i)).toFixed(dm)) + ' ' + units[i];

};

const ofBigNum = (number: number, decimals: number = 2): string => {

    if (number === 0) return '0';
    if (typeof number != "number") throw new TypeError('Argument is not number.');
    if (number < 0) throw new RangeError('Argument is Negative number.');

    const k = 1000;
    const dm = decimals < 0 ? 0 : decimals;
    const units = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];

    const i = Math.floor(Math.log(number) / Math.log(k));

    return parseFloat((number / Math.pow(k, i)).toFixed(dm)) + ' ' + units[i];

}

export { ofByte, ofHashRate, ofDiff, ofBigNum };
