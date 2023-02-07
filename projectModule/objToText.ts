export type obj = {
    blocks: number,
    avgSize: string,
    avgGasUsed: string,
    avgBFPGas: string,
    txns: number,
};

const objToText = (obj: obj): string => {

    let propertiesAryOfObj: [string, (string | number)][] = Object.entries(obj);
    let strTo: string = '';

    for (let ary of propertiesAryOfObj) {

        strTo += ary[0] + ':' + ary[1];
        strTo += '\n'

    }

    return strTo;

};

export default objToText;
