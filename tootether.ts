import "dotenv/config";
import {login} from "masto";
import Web3 from "web3";
import {BlockTransactionString} from "web3-eth";
import {currentTimeReadable, unixTimeReadable} from "@ethereum_net_stats/readable_time";
import objToText from "./projectModule/objToText.js";
import type { obj as hourlyBlockInfo } from "./projectModule/objToText.js";
import * as unitConvert from "./projectModule/unitConvert.js";

//Make sleep function
// 処理を指定時間スリープさせる関数定義
const _sleep = (ms: number): Promise<unknown> => new Promise((resolve) => setTimeout(resolve, ms));

// Create Web3 instance
// Web3のインスタンスを生成
const web3 = new Web3(new Web3.providers.HttpProvider(String(process.env.infura_https_api_url_and_key)));

// Log in mastodon.
// マストドンにログイン
const masto = await login({
    url: String(process.env.mastodon_url),
    accessToken: process.env.mastodon_access_token,
});

// Get the current unix time with unit of seconds
// 現在時刻のユニックスタイムを秒単位で取得
let currentTime: number = Math.floor(new Date().getTime() / 1000);

// Get the start time of the current 1-hour range in unix time
// 現在の１時間のレンジの開始時間をユニックスタイムで取得
let startTime: number = currentTime - (currentTime % 3600);

// Get the end time of the current 1-hour range in unix time
// 現在の１時間のレンジの終了時間をユニックスタイムで取得
let endTime: number = startTime + 3600;

// Get the latest block data
// 最新のブロックデータを取得
let getBlock: BlockTransactionString = await web3.eth.getBlock("latest");

// Store the latest block number
// 最新のブロックナンバーを格納
let detectStartBlockNumber: number = getBlock.number;

// Start detecting the start block in current 1-hour range
// 現在の１時間のレンジの最初のブロックを探す
console.log(`${currentTimeReadable()} | Start detecting the start block in current 1-hour range.`);

// Obtain the block data in detectBlockNumber decrementing until the start of the current hour
// 現在の１時間の開始時間まで、detectBlockNumberのブロックデータをデクリメントしながら取得
while (getBlock.timestamp > startTime) {

    // Get block data of detectStartBlockNumber
    // detectStartBlockNumberのブロックデータを取得
    getBlock = await web3.eth.getBlock(detectStartBlockNumber);
    console.log(`${currentTimeReadable()} | Block number : ${getBlock.number} | Block time : ${unixTimeReadable(Number(getBlock.timestamp))}`);

    //　Decrement block number
    // ブロックナンバーをデクリメント
    --detectStartBlockNumber;

}

// Stores the first block number of the current 1-hour range
// 現在の１時間のレンジの最初のブロックナンバーを格納
let startBlockNumber: number = ++getBlock.number;
console.log(`${currentTimeReadable()} | The detecting ends. Start block number : ${startBlockNumber}`);

// Array to store 1-hour block data
// １時間分のブロックデータを格納する配列
let hourlyBlockData: Array<BlockTransactionString> = [];

// Array to store 1-hour uncle block data
// １時間分のアンクルブロックデータを格納する配列
let hourlyUncleBlockData: Array<BlockTransactionString> = [];

// Stores the starting number of the block data to be collected
// 収集するブロックデータの開始ナンバーを格納
let collectBlockNumber: number = startBlockNumber;

// Stores the latest block data
// 最新のブロックデータを格納する変数の宣言
let latestBlock: BlockTransactionString;
let collectBlock: BlockTransactionString;

// Declare variables for statistics calculation
// 集計用の変数宣言
let hourlyStartTimeUnix: number;
let hourlyEndTimeUnix: number;
let blocks: number;
let totalBlockSize: number;
let averageBlockSize: number;
let totalDifficulty: number;
let averageDifficulty: number;
let totalUncleDifficulty: number;
let hashRate: number;
let transactions: number;
let totalGasUsed: number;
let averageGasUsed: number;
let totalBaseFeePerGas: number;
let averageBaseFeePerGas: number;

// Declare variables for generating toot
// トゥート生成用の変数宣言
let hourEndDatetime: Date;
let hourStartDatetime: Date;
let hourEndNumber: number;
let hourStartNumber: number;
let ampm: Array<string>;
let datetimeStr: string;
let hourlyBlockInfo: hourlyBlockInfo;
const hashTags: string = '#ETH #BTC #crypto';
let textOfToot: string;
let status;

while (true) {

    // Get the latest block data
    // 最新のブロックデータを取得
    latestBlock = await web3.eth.getBlock("latest");

    // Check the timestamp of the latest block. If the endTime beyonds the timestamp, wait until this timestamp beyond the endTime.
    // 最新ブロックデータのタイムスタンプをチェック。最新ブロックデータのタイムスタンプが現在の１時間の範囲を超えるまで１分ごとにスリープを繰り返す。
    while (latestBlock.timestamp < endTime) {
        console.log(`${currentTimeReadable()} | Waiting the latest block timestamp beyonds current 1 hour range. | Current latest block number : ${latestBlock.number} | Current latest block timestamp ${unixTimeReadable(Number(latestBlock.timestamp))}`);
        await _sleep(60 * 1000);
        latestBlock = await web3.eth.getBlock("latest");
    }

    // Get initial block data in current 1-hour range.
    // 集計対象のブロックデータを取得
    collectBlock = await web3.eth.getBlock(collectBlockNumber);

    // Collect block data for 1 hour.
    // 集計対象のブロックデータを収集
    while (collectBlock.timestamp < endTime) {

        // Push block data to hourlyBlockData.
        // 集計対象のブロックデータを配列に追加
        hourlyBlockData.push(collectBlock);

        // If the block data includes uncle block, push the uncle block data to hourly_uncle_block_data.
        // 集計対象のブロックデータがアンクルブロックを持っている場合はアンクルブロックデータを配列に追加
        if (collectBlock.uncles.length !== 0) {
            for (let i = 0; i < collectBlock.uncles.length; i++) {
                hourlyUncleBlockData.push(await web3.eth.getUncle(collectBlockNumber, i));
            }
        }

        console.log(`${currentTimeReadable()} | block_number: ${collectBlockNumber} | start_time: ${unixTimeReadable(startTime)} | block_timestamp: ${unixTimeReadable(Number(collectBlock.timestamp))} | end_time: ${unixTimeReadable(endTime)}`);

        // Increment the collect block number
        // 集計対象のブロックナンバーをインクリメント
        ++collectBlockNumber;

        // Get the next block data
        // 次のブロックデータを取得
        collectBlock = await web3.eth.getBlock(collectBlockNumber);

    }

    // When the collecting block data is done, display the initial and last elements in the array of hourly_block_data.
    // データの収集が終了した時に、最初のブロックデータと最後のブロックデータを表示
    console.log(`${currentTimeReadable()} | hourly_block_data[0]:`);
    console.log(hourlyBlockData[0]);
    console.log('');

    console.log(`${currentTimeReadable()} | hourly_block_data[last]:`);
    console.log(hourlyBlockData[hourlyBlockData.length - 1]);
    console.log('');

    //　Stores the initial collection time in unix time
    // 集計の開始時間をユニックスタイムで格納
    hourlyStartTimeUnix = startTime;

    // Stores the final collection time in unix time
    // 集計の終了時間をユニックスタイムで格納
    hourlyEndTimeUnix = endTime;

    // Calculate blocks
    // 集計時間内のブロックの数を集計
    blocks = hourlyBlockData.length;

    // Calculate totalBlockSize
    // 集計時間内のブロックサイズの合計を計算
    totalBlockSize = hourlyBlockData.reduce( (sum, elem) => {
        return sum + elem.size;
    }, 0);

    // Calculate averageBlockSize
    // 集計時間内のブロックサイズの平均値を計算
    averageBlockSize = totalBlockSize / 3600;

    // Calculate total_difficulty
    // 集計時間内の各ブロックのディフィカルティのトータルを計算
    totalDifficulty = hourlyBlockData.reduce((sum, elem) => {
        return sum + Number(elem.difficulty);
    }, 0);

    // Calculate averageDifficulty
    // 集計時間内の各ブロックのディフィカルティの時間平均値を計算
    averageDifficulty = totalDifficulty / 3600;

    // Calculate totalUncleDifficulty
    // 集計時間内の各アンクルブロックのディフィカルティのトータルを計算
    totalUncleDifficulty = hourlyUncleBlockData.reduce((sum, elem) => {
        return sum + Number(elem.difficulty);
    }, 0);

    // Calculate hashRate
    // 集計時間内のハッシュレートを計算
    hashRate = (totalDifficulty + totalUncleDifficulty) / 3600;

    // Calculate number of transactions
    // 集計時間内のトランザクション数を計算
    transactions = hourlyBlockData.reduce((sum, elem) => {
        return sum + elem.transactions.length;
    }, 0);

    // Calculate total gasUsed
    // 集計時間内の各ブロックのgasUsedのトータルを計算
    totalGasUsed = hourlyBlockData.reduce((sum, elem) => {
        return sum + elem.gasUsed;
    }, 0);

    // Calculate an averageGasUsed
    // 集計時間内の各ブロックのgasUsedの時間平均値を計算
    averageGasUsed = totalGasUsed / 3600;

    // Calculate totalBaseFeePerGas
    // 集計時間内の各ブロックのbaseFeePerGasのトータルを計算
    totalBaseFeePerGas = hourlyBlockData.reduce((sum, elem) => {
        return sum + Number(elem.baseFeePerGas);
    }, 0);

    // Calculate an averageBaseFeePerGas
    // 集計時間内の各ブロックのbaseFeePerGasの時間平均値を計算
    averageBaseFeePerGas = totalBaseFeePerGas / 3600;

    console.log(`${currentTimeReadable()} | calculated ${unixTimeReadable(hourlyStartTimeUnix)} - ${unixTimeReadable(hourlyEndTimeUnix)} | blocks:${blocks}`);
    console.log(``);

    // Make a string indicates a range of calculate range
    // トゥートする時間範囲の文字列を生成
    hourEndDatetime = new Date(hourlyEndTimeUnix * 1000);
    hourStartDatetime = new Date(hourlyStartTimeUnix * 1000);
    ampm = [];

    ampm[0] = (hourStartDatetime.getUTCHours() < 12) ? 'am' : 'pm';
    ampm[1] = (hourEndDatetime.getUTCHours() < 12) ? 'am' : 'pm';

    hourStartNumber = (hourStartDatetime.getUTCHours() < 12) ? hourStartDatetime.getUTCHours() : hourStartDatetime.getUTCHours() - 12;
    hourEndNumber = (hourEndDatetime.getUTCHours() < 12) ? hourEndDatetime.getUTCHours() : hourEndDatetime.getUTCHours() - 12;

    datetimeStr = `${hourStartNumber}${ampm[0]} - ${hourEndNumber}${ampm[1]} UTC`;

    // Generate a object for a toot
    // トゥートする集計データのオブジェクト生成
    hourlyBlockInfo = {
        blocks: blocks,
        avgSize: unitConvert.ofByte(averageBlockSize),
        avgGasUsed: unitConvert.ofBigNum(averageGasUsed),
        avgBFPGas: unitConvert.ofBigNum(averageBaseFeePerGas),
        txns: transactions,
    };

    console.log(`${currentTimeReadable()} | Hourly block info :`);
    console.log(hourlyBlockInfo);
    console.log('');

    // Generate a text for toot
    // トゥートのテキスト生成
    textOfToot = `#Ethereum hourly net stats.\n${datetimeStr}\n\n${objToText(hourlyBlockInfo)}\n${hashTags}`;

    // Post a toot
    // トゥートを投稿
    status = await masto.v1.statuses.create({
        status: textOfToot,
        visibility: 'public',
    });

    console.log(`${currentTimeReadable()} | Post a toot.`);
    console.log(status);

    startTime += 3600;
    endTime += 3600;
    hourlyBlockData = [];
    hourlyUncleBlockData = [];

    console.log(``);

}


