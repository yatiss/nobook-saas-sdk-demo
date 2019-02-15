import * as md5
    from 'blueimp-md5';
// 1、es6 或 ts 引用方式
import {
    APPID_TEST, // nobook内部使用,对接的小伙伴不需引入
    APPKEY_TEST, // nobook内部使用,对接的小伙伴不需引入
    MESSAGE_TYPE,
    LabSDK,
    PID_TYPE
} from 'nobook-saas-sdk/nobook/lab';
/*
2、页面直接引用方式
<script src="virtual-experiment.min.js"></script>
并通过 window 提取SDK
const {
    LabSDK,
    MESSAGE_TYPE,
    PID_TYPE
} = window.NBSDK;
3、es5引用方式
const NBSDK = require('nobook-saas-sdk/lab.min.js');
 */
import {
    SECRET_DATA,
    getServerData
} from './server';

/**
 * 此页面为备课模式入口页demo
 * 打开此页面会执行自动登录
 */
class main {

    constructor() {
        this.labSDK = new LabSDK();
        /** ************************************************************
         *                              账户信息
         ************************************************************* */
        // 需传入信息
        // this.uid = 'zuoyebangtest6'; // 用户账户,必填
        this.uid = 'miscourseware_test'; // 用户账户,必填
        this.nickname = '橘子'; // 用户昵称,可选
        this.labId = ''; // 实验id,列表接口获取,在预览与编辑时需传入
        // 物理 PID_TYPE.PHYSICAL
        // 化学 PID_TYPE.CHEMISTRY
        // 生物高中 PID_TYPE.BIOLOGICAL2
        this.pid = PID_TYPE.PHYSICAL; // 产品标识,nobook提供
        /** ************************************************************
         *                              第一步: 页面加载完成初始化
         ************************************************************* */
        $(() => {
            // 先添加设置
            this.labSDK.setConfig({
                // 登录部分(所有操作必须登陆后执行)
                // DEBUG: true,
                // EDIT_HOST_DEBUG_PORT: '3033',
                // EDITER_DEBUG: true,
                pid: this.pid,
                appid: SECRET_DATA.appid, // nobook 提供
                from: '作业帮'
            });
            // ------------nobook内部测试用,对接的小伙伴可忽略此判断------------//
            if (this.labSDK.DEBUG) {
                SECRET_DATA.appid = APPID_TEST;
                SECRET_DATA.appkey = APPKEY_TEST;
                this.labSDK.appid = SECRET_DATA.appid;
            }
            // ------------nobook内部测试用end------------//
            // 登录部分(所有操作必须登陆后执行)
            const {timestamp, sign} = getServerData(this.uid, this.nickname, this.pid);
            this.labSDK.login({
                uid: this.uid,
                nickname: this.nickname,
                timestamp,
                sign
            }).then((data) => {
                console.log('~登录成功:', data);
                this.init();
            }).catch((err) => {
                console.warn(err);
            });
        });
    }

    /** ************************************************************
     *                              demo页面内存操作部分
     ************************************************************* */
    /**
     * 初始化
     */
    init() {
        // 刷新左右侧列表
        this.freshList();
        this.labSDK.addListener(MESSAGE_TYPE.ON_LOAD, (event) => {
            // 编辑器或播放器实验场景初始化成功时触发
            console.log('******************页面加载完成!!!');
        });
    }

    /**
     * 给页面按钮添加事件
     */
    freshBtnHandles() {
        // 切换学科按钮
        this.freshSubjectBtn();
        // 实验按钮
        $('.lab-btn ').off('click');
        $('.lab-btn').click((evt) => {
            console.log(evt.target.textContent);
            this.freshRightList(evt.target.textContent);
        });
        this.showType(1);
        // 返回按钮
        $('.return-cla ').off('click');
        $('.return-cla').click(() => {
            $('#editIframeId').attr('src', '');
            this.showType(1);
            // 刷新左右侧列表
            this.freshList();
        });
        $('.new-cla').off('click');
        $('.new-cla').click(() => {
            console.log('~新建实验');
            this.showType(3);
        });
        $('.check-cla').off('click');
        $('.check-cla').click(() => {
            console.log('~根据id查询实验信息');
            this.checkFromId('5c63d707a6233a657555ef23'); // 输入要查询的实验id
        });
        // 编辑器插入实验
        $('.editor-insert-cla').off('click');
        $('.editor-insert-cla').click(() => {
            console.log('~编辑器插入实验:', this.labId);
            // 先保存,后插入
            this.saveData().then((result) => {
                // 从 result 中取实验id与缩略图地址
                console.log('~保存实验回调:', result);
            });
        });
        // 播放器插入实验
        $('.player-insert-cla').off('click');
        $('.player-insert-cla').click(() => {
            console.log('~播放器插入实验:', this.labId);
        });
        $('.save-cla').off('click');
        $('.save-cla').click(() => {
            console.log('~保存实验');
            /* this.saveData({title: '自定义标题' + new Date().getTime()}).then((result) => {
                      console.log('~保存实验回调:', result);
                      layer.msg('保存实验成功');
                  }); */
            this.saveData().then((result) => {
                console.log('~保存实验回调:', result);
                layer.msg('保存实验成功');
            });
        });
        $('.feedback-cla').off('click');
        $('.feedback-cla').click(() => {
            console.log('~点击反馈');
            this.labSDK.sendFeedback({
                title: '测试文本', // 标题【最大不能超过32个字符串】
                content: `测试文本的内容${new Date().getTime()}`, // 内容
                source: 'xxx公司', // 来源【对接公司名称】
                pics: '' // 图片超链接(非必须)
            }).then((data) => {
                console.log('*****请求反馈结果:', data);
            });
        });
        this.freshHidden();
    }

    // 刷新切换学科按钮
    freshSubjectBtn() {
        $('.switch-subject').empty();
        const arr = [
            ['物理', PID_TYPE.PHYSICAL],
            ['化学', PID_TYPE.CHEMISTRY],
            ['生物初中', PID_TYPE.BIOLOGICAL1],
            ['生物高中', PID_TYPE.BIOLOGICAL2]
        ];
        $('.switch-btn').off('click');
        arr.forEach((item) => {
            const domItem = `<li><button class="switch-btn" name="${item[1]}">${item[0]}</button></li>`;
            $('.switch-subject').append(domItem);
        });
        $('.switch-btn').click((evt) => {
            console.log('切换学科:', $(evt.target).text(), evt.target.name);
            if (evt.target.name !== this.pid) {
                this.labSDK.switchSubject({pid: evt.target.name});
                this.pid = this.labSDK.pid;
                this.freshList();
            } else {
                console.log('已经处于该学科,不能切换!');
            }
        });
    }

    freshHidden() {
        // 只有可diy的学科才有<我的实验>
        if (!this.labSDK.canDIY) {
            $('.diy-cla').hide();
        } else {
            $('.diy-cla').show();
        }
    }

    /**
     * 刷新页面左右侧列表
     */
    freshList() {
        this.freshLeftList();
        this.freshRightList('我的实验');
        setTimeout(() => {
            this.freshBtnHandles();
        }, 1000);
    }

    /**
     * 刷新左侧列表
     */
    freshLeftList() {
        $('#leftId').empty();
        this.getClassificationsList().then((obj) => {
            this.addLeftList(obj.data);
        }).catch((err) => {
            console.warn('左侧列表~~~~~~', err);
        });
    }

    /**
     * 刷新右侧列表
     * @param typename
     */
    freshRightList(typename) {
        $('#rightId').empty();
        const isMy = typename === '我的实验'; // 是否为 我的实验 (否则为 资源实验)
        this.getLabList(typename, isMy).then((obj) => {
            this.addRightList(obj.data, isMy);
        }).catch((err) => {
            console.warn('~~~~~~~~getLabList:', err);
        });
    }

    /**
     * 在页面左侧添加元素
     * @param arr
     */
    addLeftList(arr) {
        for (let i = 0; arr && i < arr.length; i++) {
            const item = `<li><button class="lab-btn">${arr[i]}</button></li>`;
            $('#leftId').append(item);
        }
    }

    /**
     * 在页面右侧添加元素
     * @param arr
     * @param isMy
     */
    addRightList(arr, isMy) {
        for (let i = 0; arr && i < arr.length; i++) {
            let labItem = arr[i];
            let item;
            if (isMy) {
                item = this.getMyItem(labItem._id, labItem.title, this.labSDK.getMyIconURL(labItem.properties.icon.url));
            } else {
                item = this.getSourceItem(labItem.id, labItem.name, this.labSDK.getOfficiaIconURL(labItem.icon));
            }
            $('#rightId').append(item);
        }
        //
        $('.viewCla').off('click');
        $('.viewCla').on('click', (evt) => {
            let labId = evt.target.value;
            this.showType(2, labId);
        });
        //
        $('.editCla').off('click');
        $('.editCla').on('click', (evt) => {
            let labId = evt.target.value;
            this.showType(3, labId);
        });
        //
        $('.editClaSource').off('click');
        $('.editClaSource').on('click', (evt) => {
            let labId = evt.target.value;
            this.showType(4, labId);
        });
        //
        $('.delCla').off('click');
        $('.delCla').on('click', (evt) => {
            let labId = evt.target.value;
            this.delData(labId).then((obj) => {
                console.log('~删除:', obj.success, obj.msg);
                // 刷新右侧列表
                this.freshRightList('我的实验');
            });
        });
        //
        $('.renameCla').off('click');
        $('.renameCla').on('click', (evt) => {
            let labId = evt.target.value;
            let newName = $(evt.target).siblings('input').val();
            this.renameData(labId, newName).then((obj) => {
                console.log('~重命名:', obj);
                // 刷新右侧列表
                this.freshRightList('我的实验');
            });
        });
        this.freshHidden();
    }

    /**
     * 生成我的实验模块列表
     */
    getMyItem(id, name, iconURL) {
        return `
            <div class="item" style="background-image: url(${iconURL});">
                <button class="viewCla" value="${id}">预览</button>
                <button class="editCla" value="${id}">编辑</button>
                <button class="delCla" value="${id}">删除</button>
                <button class="renameCla" value="${id}">重命名</button>
                <input class="div-name" value="${name}"></input>
         </div>
        `;
    }

    /**
     * 生成资源模块列表
     */
    getSourceItem(id, name, iconURL) {
        return `
            <div class="item" style="background-image: url(${iconURL});">
                <button class="viewCla" value="${id}">预览</button>
                <button class="editClaSource diy-cla" value="${id}">编辑</button>
                <div class="div-name">${name}</div>
            </div>
        `;
    }

    /**
     * 切换场景
     * @param type
     * @param labId
     */
    showType(type, labId) {
        this.labId = labId;
        $('#listBoxId,#editBoxId,#playBoxId').hide();
        switch (type) {
            case 1:
                $('#listBoxId').show();
                break;
            case 2:
                $('#playBoxId').show();
                if (labId) {
                    // 打开实验
                    console.log('*****************labId:', labId);
                    const url = this.labSDK.getPlayerURL(labId);
                    console.log('预览:', url);
                    $('#viewIframeId').attr('src', url);
                }
                break;
            case 3:
                // 我的资源的新建/编辑功能
                $('#editBoxId').show();
                if (labId) {
                    // 通过实验id打开实验
                    const url = this.labSDK.getEditerURL(labId);
                    console.log('~编辑实验:', url);
                    $('#editIframeId').attr('src', url);
                    this.freshEditData(); // 刷新使用场景数据
                } else {
                    // 新建实验
                    const url = this.labSDK.getEditerURL();
                    console.log('~新建实验:', url);
                    $('#editIframeId').attr('src', url);
                    this.freshEditData();
                }
                break;
            case 4:
                // 官方资源列表的编辑
                $('#editBoxId').show();
                if (labId) {
                    // 通过实验id打开实验
                    const url = this.labSDK.getEditerURL(labId, true); // 来自于官方精品资源
                    console.log('~官方列表:编辑实验:', url);
                    $('#editIframeId').attr('src', url);
                    this.freshEditData(); // 刷新使用场景数据
                }
                break;
            default:
                break;
        }
    }

    /**
     * 刷新实验场景(如果修改数据了)
     */
    freshEditData() {
        if ($('#editIframeId')[0]) {
            this.labSDK.freshEditerScreen({iframeWindow: $('#editIframeId')[0].contentWindow});
        }
    }

    /** **************************************************************
     *                              实验接口测试部分
     *************************************************************** */
    /**
     * 获取获取资源类别接口
     */
    getClassificationsList() {
        // 物理有模块接口
        return this.labSDK.getClassificationsList();
    }

    /**
     * 保存接口（用 postMessage 发消息）
     * @returns {Promise<any>}
     */
    saveData(config) {
        config = config || {};
        config.iframeWindow = $('#editIframeId')[0].contentWindow;
        return this.labSDK.saveData(config);
    }

    /**
     * 删除实验接口
     * @param labId
     */
    delData(labId) {
        return this.labSDK.deleteData(labId);
    }

    /**
     * 重命名接口
     * @param labId
     * @param name
     */
    renameData(labId, title) {
        return this.labSDK.renameData(labId, title);
    }

    /**
     * 获取实验列表接口
     * @param typename 类型名称
     * @param isMy 是否为"我的实验"类型
     * @returns {Promise<any>}
     */
    getLabList(typename, isMy) {
        if (isMy) {
            return this.labSDK.getMyLabList();
        }
        return this.labSDK.getLabList(typename);

    }

    /**
     * 获取单个实验详细信息的接口(DIY的物理/化学专用)
     */
    checkFromId(labId) {
        return this.labSDK.getLabDetail(labId).then((param) => {
            const obj = param.data;
            console.log('~实验昵称:', obj.title);
            console.log('~实验是否包含vip元件:', obj.containsVipequ); // true代表有vip器材;false或undefined代表无vip器材
            console.log('~实验缩略图:', this.labSDK.getMyIconURL(obj.properties.icon.url)); // true代表有vip器材;false或undefined代表无vip器材
        }).catch((param) => {
            console.log('~获取单个实验详细信息失败:', param);
        });
    }
}

new main();
