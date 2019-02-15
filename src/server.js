import * as md5
  from 'blueimp-md5';
/** ******************************************************
 *      注意: 此文件为模仿后台处理,一下方法与数据都必须放到后台,
 *      即 appkey 必须要隐藏, 即签名sign为后端输出
 ******************************************************* */
export const SECRET_DATA = {
  appid: 'xxxx', // nobook提供
  appkey: 'xxxx' // 重要注意: nobook提供(appkey需后台保存,如果前台暴露引发任何损失概不负责)
};

/**
 * 生成签名, 规则为: md5(appid appkey nickname pid timestamp uid)
 * @param uid
 * @param nickname
 * @returns {*}
 */
export function getServerData(uid, nickname, pid) {
  const timestamp = new Date().getTime().toString().substring(0, 10);
  const sign = md5(SECRET_DATA.appid + SECRET_DATA.appkey + nickname + pid + timestamp + uid);
  return {
    timestamp,
    sign
  };
}
