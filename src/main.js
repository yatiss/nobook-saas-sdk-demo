import * as md5
    from 'blueimp-md5';
// 1、es6 或 ts 引用方式
import {
    APPKEY_TEST, // nobook内部使用,对接的小伙伴不需引入
    APPSECRET_TEST, // nobook内部使用,对接的小伙伴不需引入
    MESSAGE_TYPE,
    LabSDK,
    PID_TYPE
} from '@nobook/nobook-saas-sdk/nobook/lab';
/*
2、页面直接引用方式
<script src="lab.min.js"></script>
并通过 window 提取 NB_SDK_LAB
const {
    LabSDK,
    MESSAGE_TYPE,
    PID_TYPE
} = window.NB_SDK_LAB;
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
        this.uniqueId = 'zuotest2'; // 用户账户,必填
        this.nickname = '橘子'; // 用户昵称,可选
        this.labId = ''; // 实验id,列表接口获取,在预览与编辑时需传入
        // 初中物理 PID_TYPE.PHYSICAL1
        // 初中化学 PID_TYPE.CHEMISTRY1
        // 高中生物 PID_TYPE.BIOLOGICAL2
        this.pidType = PID_TYPE.PHYSICAL1; // 产品标识,nobook提供
        /** ************************************************************
         *                              第一步: 页面加载完成初始化
         ************************************************************* */
        $(() => {
            // 先添加设置
            this.labSDK.setConfig({
                // 登录部分(所有操作必须登陆后执行)
                // EDIT_HOST_DEBUG: 'http://localhost:3033/',
                // PLAYER_DEBUG: true,
                // PLAYER_HOST_DEBUG: 'http://localhost:4800/',
                pidType: this.pidType,
                appKey: SECRET_DATA.appKey, // nobook 提供
                from: '作业帮',
                debugSettings: {
                    DOC_DEBUG: true,
                    physics: {
                        EDITER: 'http://192.168.1.111:3880/debug_version/PHYSICS/PHYSICS_P-[v5.0.2]-F-[develop]-C-[]',
                        // EDITER: 'http://localhost:3033',
                        // PLAYER: 'http://localhost:4800'
                    },
                    chemical: {
                        EDITER: 'http://localhost:3030'
                    }
                }
            });
            // ------------nobook内部测试用,对接的小伙伴可忽略此判断------------//
            if (this.labSDK.DEBUG) {
                SECRET_DATA.appKey = APPKEY_TEST;
                SECRET_DATA.appSecret = APPSECRET_TEST;
                this.labSDK.appKey = SECRET_DATA.appKey;
            }
            // ------------nobook内部测试用end------------//
            this.login();
        });
    }

    login() {
        // 登录部分(所有操作必须登陆后执行)
        // pidScope 登录授权的产品id
        const pidScope = this.labSDK.getAllLabPidScope(); // 用逗号隔开的产品id
        const {timestamp, sign} = getServerData(this.uniqueId, this.nickname, pidScope);
        this.labSDK.login({
            uniqueId: this.uniqueId,
            nickname: this.nickname,
            timestamp,
            sign,
            pidScope
        }).then((data) => {
            console.log('~登录成功:', data);
            $('.ni-cla').text('已登录: ' + this.nickname);
            this.init();
        }).catch((err) => {
            console.warn(err);
        });
    }

    loginout() {
        this.labSDK.logout().then(data => {
            console.log('~退出成功:', data);
            $('.ni-cla').text('未登录');
            $('#rightId').empty();
            this.freshLabNumsId();
        }).catch((err) => {
            console.warn(err);
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
        this.showType(1);
    }

    /**
     * 给页面按钮添加事件
     */
    freshBtnHandles() {
        // 登录
        $('.use-cla').val(this.uniqueId);
        // 登录按钮
        $('.login-btn').off('click');
        $('.login-btn').click(evt => {
            if ($('.login-btn').text() === '退出') {
                // 执行退出
                $('.login-btn').text('登录');
                $('.use-cla').val('');
                this.loginout();
            } else {
                // 执行登录
                let uniqueId = $('.use-cla').val();
                uniqueId = uniqueId.replace(/(^\s*)|(\s*$)/g, '');
                if (uniqueId.length) {
                    $('.login-btn').text('退出');
                    this.uniqueId = uniqueId;
                    this.login();
                }
            }
        });
        // 搜索按钮
        $('#searchDIYBtn').off('click');
        $('#searchDIYBtn').click(evt => {
            this.searchDIY($('#searchDIYId').val());
        });
        $('#searchSourceBtn').off('click');
        $('#searchSourceBtn').click(evt => {
            this.searchResources($('#searchSourceId').val());
        });
        // 切换学科按钮
        this.freshSubjectBtn();
        // 实验按钮
        $('#clearDIYBtn ').off('click');
        $('#clearDIYBtn').click((evt) => {
            this.clearRedis();
            layer.msg('清除完成');
        });
        // 实验按钮
        $('.lab-btn ').off('click');
        $('.lab-btn').click((evt) => {
            console.log(evt.target.textContent);
            this.freshRightList(evt.target.value - 0);
        });
        // 返回按钮
        $('.return-cla ').off('click');
        $('.return-cla').click(() => {
            this.clearIframe($('#editIframeId')[0]);
            this.showType(1);
            // 刷新左右侧列表
            this.freshList();
        });
        $('.new-cla').off('click');
        $('.new-cla').click((evt) => {
            console.log('~新建实验', evt.target.value);
            this.showType(3, null, evt.target.value);
        });
        // 播放器插入实验
        $('.player-insert-cla').off('click');
        $('.player-insert-cla').click(() => {
            console.log('~播放器插入实验:', this.labId);
        });
        $('.save-cla').off('click');
        $('.save-cla').click(() => {
            console.log('~保存实验');
            this.saveData().then((result) => {
                console.log('~保存实验回调:', result);
                layer.msg(`保存实验${result.success ? '成功' : '失败'}`);
            });
        });
        $('.switch-chapter').off('click');
        $('.switch-chapter').click((evt) => {
            this.freshList(evt.target.value);
        });
        this.freshHidden();
    }

    // 刷新切换学科按钮
    freshSubjectBtn() {
        $('.switch-subject').empty();
        const arr = [
            ['初中物理', PID_TYPE.PHYSICAL1],
            ['高中物理', PID_TYPE.PHYSICAL2],
            ['初中化学', PID_TYPE.CHEMICAL1],
            ['高中化学', PID_TYPE.CHEMICAL2],
            ['初中生物', PID_TYPE.BIOLOGICAL1],
            ['高中生物', PID_TYPE.BIOLOGICAL2]
        ];
        $('.switch-btn').off('click');
        arr.forEach((item) => {
            const domItem = `<li><button class="switch-btn" value="${item[1]}">${item[0]}</button></li>`;
            $('.switch-subject').append(domItem);
        });
        $('.switch-btn').click((evt) => {
            const pidType = evt.target.value;
            console.log('切换学科:', $(evt.target).text(), pidType);
            if (pidType !== this.pidType) {
                this.labSDK.switchSubject({
                    pidType: pidType
                });
                this.pidType = this.labSDK.pidType;
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
    freshList(type) {
        if (!type || type === '0') {
            // 模块形式
            console.log('~~~模块形式排版');
            $('.module-class').show();
            $('.chapter-class').hide();
            this.freshLeftList();
            this.freshRightList(-1);
        } else {
            // 章节形式
            console.log('~~~章节形式排版');
            $('.module-class').hide();
            $('.chapter-class').show();
            this.freshLeftListByChapter();
        }

        setTimeout(() => {
            this.freshBtnHandles();
        }, 1000);
    }

    /**
     * 刷新左侧列表(模块形式)
     */
    freshLeftList() {
        $('#leftId').empty();
        this.getClassificationsList().then((obj) => {
            this.addLeftList(obj.data);
        }).catch((err) => {
            console.warn('刷新左侧列表(模块形式)~~~~~~', err);
        });
    }

    /**
     * 刷新左侧列表(章节形式)
     */
    freshLeftListByChapter() {
        this.getChapter().then(obj => {
            $('.se-cla').off('change');
            $('.chapter-class').empty();
            this.gradeData = obj.data;
            this.levelArr = [];
            this.addSelect();
            this.freshOption(0);
            this.freshOption(1);
            this.freshOption(2);
        }).catch((err) => {
            console.warn('刷新左侧列表(章节形式)~~~~~~', err);
        });
    }

    // 分级显示右侧内容
    // 结构: 年级-学科-版本-教材-章-节
    // 传参只传后4项: 版本-教材-章-节      versionId-textbookId-chapterId-sectionId
    findByLevel(idArr) {
        console.log('~~分级显示id:', idArr.join(','));
        $('#rightId').empty();
        this.labSDK.getResourcesByChapter({
            versionId: idArr[2],
            textbookId: idArr[3],
            chapterId: idArr[4],
            sectionId: idArr[5]
        }).then((obj) => {
            this.addRightList(obj, false);
        }).catch((err) => {
            console.warn('~~~~~~~~getLabList:', err);
        });
    }

    selectedFunc(evt) {
        const optValue = $(evt.target).children('option:selected').val();
        const arr = optValue.split('-');
        const seIndex = arr[1] - 0; //
        const optIndex = arr[2] - 0;
        if (seIndex >= this.levelArr.length) return;
        this.levelArr[seIndex].selected = optIndex;
        if (seIndex < 5) {
            this.freshOption(seIndex + 1);
        }
        // 提取内容
        const tArr = []; // 最终分级数组
        let nextArr = this.gradeData;
        let curItem;
        for (let i = 0; i <= seIndex; i++) {
            curItem = nextArr[this.levelArr[i].selected];
            tArr.push(curItem);
            if (curItem.children) {
                nextArr = curItem.children;
            }
        }
        //seLabelId
        let str = ' 分级显示:';
        let idArr = [];
        tArr.forEach((item, index) => {
            str += item.name;
            if (index < tArr.length - 1) {
                str += ' -> ';
            }
            idArr.push(item.id);
        });
        $('#seLabelId').text(str);
        //
        this.findByLevel(idArr);
    }

    addSelect() {
        $('.chapter-class').append(`<label id="seLabelId">分级显示:</label>`);
        for (let i = 0; i < 6; i++) {
            const $se = $(`<select id="seId-${i}" class="se-cla"></select>`);
            $('.chapter-class').append($se);
        }
        $('.se-cla').on('change', this.selectedFunc.bind(this));
    }

    freshOption(levelIndex) {
        // 后面的移除
        this.levelArr.splice(levelIndex);
        for (let i = levelIndex; i <= 5; i++) {
            $(`#seId-${i}`).empty();
        }
        // 根据 levelArr 进行刷新
        if (levelIndex === 0) {
            // 第一级: 初高中
            if (!this.levelArr[0]) {
                this.levelArr[0] = {selected: 0};
                $(`#seId-0`).append(`<option selected="selected">${this.gradeData[0].name}</option>`);
            }
        } else {
            const oriItem = this.levelArr[levelIndex - 1]; // 上一级
            let nextArr = this.gradeData;
            let curItem;
            for (let i = 0; i < levelIndex; i++) {
                curItem = nextArr[this.levelArr[i].selected];
                if (curItem && curItem.children) {
                    nextArr = curItem.children;
                }
            }
            // 遍历 nextArr 添加 option
            nextArr.forEach((item, index) => {
                const optValue = `opt-${levelIndex}-${index}`;
                if (index === 0) {
                    $(`#seId-${levelIndex}`).append(`<option selected="selected" value="${optValue}">${item.name}</option>`);
                } else {
                    $(`#seId-${levelIndex}`).append(`<option value="${optValue}">${item.name}</option>`);
                }
            });
            this.levelArr[levelIndex] = {selected: 0};
        }
    }

    /**
     * 刷新右侧列表
     * @param typename
     */
    freshRightList(categoryId) {
        $('#rightId').empty();
        this.freshLabNumsId();
        if (categoryId === -1) {
            // 为我的实验
            this.labSDK.getDIYLabList({
                page: 1,
                perPage: 50
            }).then((obj) => {
                this.addRightList(obj.data, true);
            }).catch((err) => {
                console.warn('~~~~~~~~getDIYLabList:', err);
            });
        } else {
            // 为官方资源
            this.labSDK.getResourcesByCategory({categoryId: categoryId}).then((obj) => {
                this.addRightList(obj, false);
            }).catch((err) => {
                console.warn('~~~~~~~~getResourcesByCategory:', err);
            });
        }
    }

    /**
     * 在页面左侧添加元素
     * @param arr
     */
    addLeftList(obj) {
        Object.keys(obj).forEach(item => {
            $('#leftId').append(`<li><button class="lab-btn" value="${item}">${obj[item]}</button></li>`);
        });
    }

    /**
     * 在页面右侧添加元素
     * @param obj
     * @param isMy
     */
    addRightList(obj, isMy) {
        if (isMy) {
            // 为我的实验
            let arr = obj.data;
            console.log('~~分页数据:page:', obj.page);
            console.log('~~分页数据:perPage:', obj.perPage);
            for (let i = 0; arr && i < arr.length; i++) {
                let labItem = arr[i];
                let item;
                if (isMy) {
                    // 为我的实验
                    item = this.getMyItem(labItem._id, labItem.title, this.labSDK.getDIYIconURL(labItem.properties.icon.url));
                } else {
                    // 为官方资源
                    item = this.getSourceItem(labItem._id, labItem.title, this.labSDK.getOfficiaIconURL(labItem.iconUrl));
                }
                $('#rightId').append(item);
            }
        } else {
            // 为官方资源
            let arr = obj.data;
            for (let i = 0; arr && i < arr.length; i++) {
                let labItem = arr[i];
                let item = this.getSourceItem(labItem._id, labItem.title, this.labSDK.getOfficiaIconURL(labItem.iconUrl));
                $('#rightId').append(item);
            }
        }

        //
        $('.insertCla').off('click');
        $('.insertCla').on('click', (evt) => {
            let labId = evt.target.value;
            console.log('插入实验id: ', labId);
            layer.msg('插入实验id: ' + labId);
        });
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
                this.freshRightList(-1);
            });
        });
        //
        $('.renameCla').off('click');
        $('.renameCla').on('click', (evt) => {
            let labId = evt.target.value;
            let newTitle = $(evt.target).siblings('input').val();
            this.renameData(labId, newTitle).then((obj) => {
                console.log('~重命名:', obj);
                // 刷新右侧列表
                this.freshRightList(-1);
            });
        });
        //
        $('.shareBtnCla').off('click');
        $('.shareBtnCla').on('click', (evt) => {
            let labId = evt.target.value;
            let otherUniqueId = $(evt.target).siblings('input').val();
            otherUniqueId = otherUniqueId.replace(/(^\s*)|(\s*$)/g, '');
            console.log('用户: ', otherUniqueId, '        分享实验:', labId);
            if (!otherUniqueId.length) {
                layer.msg('分享用户不能为空');
            } else {
                this.share(labId, otherUniqueId);
            }
        });
        //
        $('.diyInfoCla').off('click');
        $('.sourceInfoCla').off('click');
        $('.diyInfoCla,.sourceInfoCla').on('click', (evt) => {
            let labId = evt.target.value;
            console.log('*************', $(evt.target).hasClass('diyInfoCla'));
            if ($(evt.target).hasClass('diyInfoCla')) {
                // DIY
                this.getInfoDIY(labId);
            } else {
                // 资源
                this.getInfoResources(labId);
            }
        });
        //
        this.freshHidden();
        this.freshLabNumsId();
    }

    /**
     * 生成我的实验模块列表
     */
    getMyItem(id, name, iconURL) {
        return `
            <div class="item" style="background-image: url(${iconURL});">
                <button class="insertCla" value="${id}">插入</button>
                <button class="viewCla" value="${id}">预览</button>
                <button class="editCla" value="${id}">编辑</button>
                <button class="delCla" value="${id}">删除</button>
                <button class="renameCla" value="${id}">重命名</button>
                <button class="diyInfoCla" value="${id}">获取详情</button>
                <div class="share-div">
                    <label>其他用户id</label><input><button class="shareBtnCla" value="${id}">分享实验</button>
                </div>
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
                <button class="insertCla" value="${id}">插入</button>
                <button class="viewCla" value="${id}">预览</button>
                <button class="editClaSource diy-cla" value="${id}">编辑</button>
                <button class="sourceInfoCla" value="${id}">获取详情</button>
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
        console.log('***********showType:', type);
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
                    const url = this.labSDK.getPlayerURL({labId});
                    console.log('预览:', url);
                    $('#viewIframeId').attr('src', url);
                }
                break;
            case 3:
                // 我的资源的新建/编辑功能
                $('#editBoxId').show();
                if (labId) {
                    // 通过实验id打开实验
                    const url  = this.labSDK.getEditerURL({labId});
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
                    const url  = this.labSDK.getEditerURL({labId:labId, fromOfficia:true}); // 来自于官方精品资源
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

    freshLabNumsId() {
        $('#labNumsId').text(' 实验数量：' + $('#rightId').children().length);
    }

    /** **************************************************************
     *                              实验接口测试部分
     *************************************************************** */
    searchDIY(keyword) {
        keyword = keyword || '';
        keyword = keyword.replace(/(^\s*)|(\s*$)/g, '');
        console.log('~~搜索DIY:', keyword);
        $('#rightId').empty();
        this.freshLabNumsId();
        if (!keyword.length) {
            // 返回所有
            this.freshRightList(-1);
        } else {
            // 返回指定
            this.labSDK.searchDIY({keyword: keyword}).then(obj => {
                this.addRightList(obj, true);
            });
        }
    }

    searchResources(keyword) {
        keyword = keyword || '';
        keyword = keyword.replace(/(^\s*)|(\s*$)/g, '');
        console.log('~~搜索官方资源:', keyword);
        $('#rightId').empty();
        this.freshLabNumsId();
        this.labSDK.searchResources({keyword: keyword}).then(obj => {
            this.addRightList(obj, false);
        });
    }

    /**
     * 获取获取资源类别接口(模块分类)
     */
    getClassificationsList() {
        // 物理有模块接口
        return this.labSDK.getClassificationsList();
    }

    /**
     * 章节分类
     */
    getChapter() {
        // 物理有模块接口
        return this.labSDK.getChapter();
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
        return this.labSDK.deleteData({labId});
    }

    /**
     * 重命名接口
     * @param labId
     * @param name
     */
    renameData(labId, newTitle) {
        return this.labSDK.renameData({
            labId,
            newTitle
        });
    }

    /**
     * 获取单个实验详细信息的接口
     */
    getInfoResources(labId) {
        this.labSDK.getInfoResources({labId}).then((param) => {
            const obj = param.data;
            const mess = `
                ~实验昵称: ${obj.title}
                ~实验是否包含vip元件: ${obj.containsVipequ} 
                ~实验缩略图: ${obj.iconfull}
            `;
            console.log(mess);
            layer.msg(mess);
        }).catch((param) => {
            console.log('~获取单个实验详细信息失败:', param);
        });
    }

    getInfoDIY(labId) {
        this.labSDK.getInfoDIY({labId}).then((param) => {
            const obj = param.data;
            // containsVipequ:true代表有vip器材;false或undefined代表无vip器材
            const mess = `
                ~实验昵称: ${obj.title}
                ~实验是否包含vip元件: ${obj.containsVipequ}
                ~实验缩略图: ${obj.iconfull}
            `;
            console.log(mess);
            layer.msg(mess);
        }).catch((param) => {
            console.log('~获取单个实验详细信息失败:', param);
        });
    }

    share(labId, otherUniqueId) {
        return this.labSDK.shareDIY({
            uniqueId: otherUniqueId,
            labId: labId
        });
    }

    clearRedis() {
        this.labSDK.clearRedis().then(data => {
            console.log('~~~clear result:', data);
        });
    }

    clearIframe(iframe) {
        iframe.src = 'about:blank';
        try {
            iframe.contentWindow.document.write('');
            iframe.contentWindow.document.clear();
        } catch (e) {
        }
    }
}

new main();
