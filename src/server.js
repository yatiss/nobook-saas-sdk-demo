import * as md5
  from 'blueimp-md5';
/** ******************************************************
 *      注意: 此文件为模仿后台处理,一下方法与数据都必须放到后台,
 *      即 appSecret 必须要隐藏, 即签名sign为后端输出
 ******************************************************* */
export const SECRET_DATA = {
  appKey: 'xxx', // nobook提供
  appSecret: 'xxx' // 重要注意: nobook提供(appSecret需后台保存,如果前台暴露引发任何损失概不负责)
};

/**
 * 生成签名, 规则为: md5(appKey appSecret nickname pidScope timestamp uniqueId usertype)
 * usertype 为常量 0
 * pidScope 如果要为多个产品授权,则多个产品用逗号隔开
 * @param uniqueId
 * @param nickname
 * @returns {*}
 */
export function getServerData(uniqueId, nickname, pidScope) {
  const timestamp = new Date().getTime().toString().substring(0, 10);
  const sign = md5(SECRET_DATA.appKey + SECRET_DATA.appSecret + nickname + pidScope + timestamp + uniqueId + '0');
  return {
    timestamp,
    sign
  };
}
