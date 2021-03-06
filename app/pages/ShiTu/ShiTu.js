/**
 * Created by Rabbit on 2017/4/19.
 */
import React, { Component } from 'react';
import {
    AppRegistry,
    StyleSheet,
    AsyncStorage,
    InteractionManager,
    StatusBar,
    findNodeHandle,
    NetInfo,
    BackHandler,
    Alert
} from 'react-native';
import { toastShort } from '../../common/ToastUtils'

import NetWorkTool from '../../common/NetInfo'

import { connect } from 'react-redux';

import { userToken } from '../../actions/Common/UserToken';

import { qiNiuToken, getQiNiuToken, getPerent } from '../../actions/ShiTu/SearchPicture';
import { backImage,getBackImage } from '../../actions/ShiTu/BackImage';

// import {isNetworkConnected} from '../common/isNetInfo';
let lastClickTime = 0;
import {  View, Text, Image } from 'react-native-animatable';
import Button from '../../component/Button';
const { BlurView ,VibrancyView} = require('react-native-blur');
import ImagePicker from 'react-native-image-picker';
import * as Progress from 'react-native-progress';
import { observable, runInAction, autorun } from 'mobx';
import { observer } from 'mobx-react/native';


import JPushModule from 'jpush-react-native';

import Request from '../../common/Request';
import Config from '../../common/Config';

// 底部弹出框文字
let photoOptions = {
    title: '选择照片',
    cancelButtonTitle:'取消',
    takePhotoButtonTitle:'拍照',
    chooseFromLibraryButtonTitle:'选择相册',
    quality:0.75,
    allowsEditing:true,
    noData:false,
    storageOptions: {
        skipBackup: true,
        path: 'images'
    }
};

let hintText = '点击按钮,搜索你想知道的图片哦!';
let imageUri = '';

@observer
class ShiTu extends Component {

    // 进度条
    @observable
    perent=0;
    // 是否正在查找中
    @observable
    isUpload=false;
    // @observable
    // hintText= '点击按钮,搜索你想知道的图片哦!';
    @observable
    viewRef = null;

    static navigationOptions = ({navigation,screenProps}) => ({
        onTabPress:(()=>{
            alert('aaa');
        })
    });

    onBackAndroid=()=>{

        const {routes} = this.props;

        console.log(routes);

        let now = new Date().getTime();
        if (now - lastClickTime < 2500 ){
            return false;
        }
        lastClickTime = now ;
        toastShort('再按一次退出应用');
        return true;

    }

    // 检测网络状态
    handleMethod = (isConnected)=> {
        // 检测网络状态
        // console.log('ShiTu', (isConnected ? 'online' : 'offline'));
        NetInfo.removeEventListener(NetWorkTool.TAG_NETWORK_CHANGE, this.handleMethod);
    };

    componentDidMount(){

        console.log('componentDidMount');
        this.props.backImage(()=>{
            this.props.userToken();
        });

        this.props.navigation.navigate('WEB')

        const {routes} = this.props;
        console.log(routes);
        // alert(routes.length)

        // console.log(this.props);

        //Android?JPushModule.initPush():null;
        // Android?JPushModule.notifyJSDidLoad():null;

        // JPushModule.addReceiveNotificationListener((map) => {
        //     // console.log("alertContent: " + map.alertContent);
        //     // console.log("extras: " + map.extras);
        //     // this.setState({pushMsg:map});
        //     console.log(map);
        //     alert(map.alertContent);
        //     // var extra = JSON.parse(map.extras);
        //     // console.log(extra.key + ": " + extra.value);
        // });


        // Request.get(Config.api.test.test,(data)=>{
        //     console.log(data);
        // },(error)=>{
        //     console.log(error);
        // });

        if (Android){
            BackHandler.addEventListener('handwareBackPress',this.onBackAndroid)
        }


        JPushModule.addReceiveCustomMsgListener((message) => {
            console.log(message);
            //这是默认的通知消息
            alert(message.alertContent);
            // this.setState({pushMsg:message});

        });

        JPushModule.addReceiveOpenNotificationListener((message)=>{
            console.log(message);
            alert(message.alertContent);
        })


        // console.log(this.props.ShiTuReducer);

        // NetWorkTool.checkNetworkState((isConnected)=>{
        //     console.log(isConnected);
        // });

    };

    componentWillMount(){
        console.log('componentWillMount');
        // this.props.dispatch(userToken());
        // alert(PixelRatio)
        iOS
            ?
            NetWorkTool.listenerNetworkState(()=>{
                NetWorkTool.addEventListener(NetWorkTool.TAG_NETWORK_CHANGE, this.handleMethod);
            })
            :
            NetWorkTool.listenerNetworkState((isConnected)=>{
                console.log(isConnected);
            });


        // console.log(this.props);
        // const {getQiNiuToken} = this.props;
        // getQiNiuToken({name:'1111'});//这里就是触发  action 方法

    }

    componentWillUnmount(){
        // this.subscription.remove();
        this.setIntervar && clearInterval(this.setIntervar);
        NetWorkTool.removeEventListener(NetWorkTool.TAG_NETWORK_CHANGE,this.handleMethod);
        if (Android){
            BackHandler.addEventListener('handwareBackPress',this.onBackAndroid)
        }
    }   


    componentWillReceiveProps(nextProps){
        console.log('componentWillReceiveProps');

        const { navigate } = this.props.navigation;
        const { imageURL, qiNiuData} = nextProps.ShiTuReducer;

        if (this.props.ShiTuReducer.imageURL !== imageURL){
            if (imageURL) {
                // console.log(imageURL);
                imageUri=imageURL;
                this.viewRef = 88;
            }
            this.isUpload = false;
        }

        if (this.props.ShiTuReducer.qiNiuData !== qiNiuData){
            if (qiNiuData) {
                const { webURL } = qiNiuData.data;
                if (webURL) {
                    this.setIntervar && clearInterval(this.setIntervar);
                    navigate('WebViewDetail', {
                        data: webURL,
                        isVisible: true
                    });

                    this.isUpload = false;
                    this.perent = 0;
                    hintText = '是否是您寻找的答案呢?'
                }
            }
        }
    }



    constructor(props){
        super(props);

        this.state = {
            // viewRef: null,
            // imageUri:'timg',
        }
    };

    _upload = (body) => {
        // 开启XMLHttpRequest服务
        let xhr = new XMLHttpRequest();

        console.log(body);

        /** 上传到七牛云的地址 */
        let url = Config.qiniu.upload;

        // 开启post上传
        xhr.open('POST',url);

        const { navigate } = this.props.navigation;

        // 如果正在上传,将上传返回的onprogress
        if (xhr.upload){
            xhr.upload.onprogress = (event)=>{
                if (event.lengthComputable){
                    // let perent = event.loaded / event.total.toFixed(2);
                    // 搜索进度打印
                    // console.log(perent);
                    // this.perent = perent;

                    this.isUpload = true;
                }
            }
        }

        // 上传过成功的返回
        xhr.onload = ()=>{
            // console.log(xhr.status);
            // 状态码如果不等于200就代表错误
            if (xhr.status !== 200){
                alert('请求失败');
                console.log(xhr.responseText);
                return;
            }
            if (!xhr.responseText){
                alert('请求失败');
                console.log(xhr.responseText);
                return;
            }
            // 服务器最后返回的数据
            let response;
            try{
                // 将返回数据还原
                response = JSON.parse(xhr.response);
                // console.log(response);

                let body = {
                    token:response.key,
                };

                Request.post(Config.api.postWebUrl,body,(data)=>{
                    console.log('getWebUrl');
                    console.log(data);

                    let imageURL = data.data.imageURL;
                    let timestamp = Date.parse(new Date());

                    realm.write(() => {
                        realm.create('History', {
                             id:      response.key.replace('.jpeg',''),
                             imageURL:   imageURL,
                             timestamp:  timestamp
                        });
                    });
                    data.data.title = '搜索详情';

                    // if(this.perent === 1){
                    //     console.log(this.perent);
                    //
                    // }
                    if (this.perent === 1){
                        InteractionManager.runAfterInteractions(()=> {
                            // navigate('Detail', {
                            //     data: data.data.webURL,
                            //     title:'搜索详情',
                            //     isVisible:true
                            // });
                            this.isUpload = false;
                            this.hintText = '是否是您寻找的答案呢?'
                        });
                    }
                },(error) =>{
                    console.log(error);
                });
            }
            catch (e){
                console.log(e);
            }
        };

        xhr.send(body);
    };

    _onPress = () => {

        const { userToken } = this.props.ShiTuReducer;

        // console.log(this.props);

        ImagePicker.showImagePicker(photoOptions, (response) => {
            // console.log('Response = ', response);
            if (response.didCancel) {
                console.log('点击了取消按钮');
                return;
            }
            if(!response.error){
                // this.props.getPerent();

                this.props.getBackImage(response.uri);
                if (userToken){
                    this.isUpload = true;

                    this.setIntervar = setInterval(()=>{
                        this.perent = this.perent + 0.01;
                        // console.log(this.perent);
                        if (this.perent >= 1.0){
                            this.setIntervar && clearInterval(this.setIntervar);
                        }
                    });

                    this.props.qiNiuToken(response);
                    // this.setIntervar && clearInterval(this.setIntervar);

                }
                else{
                    console.log('没有获取到USERTOKEN');
                    alert('没有获取到USERTOKEN');
                }
            }
        });
    };

    _imageOnLoaded = ()=> {
        Android && InteractionManager.runAfterInteractions(() => {
            setTimeout(() => {
                // this.setState({ viewRef: findNodeHandle(this.backgroundImage) });
                this.viewRef = findNodeHandle(this.backgroundImage);
            }, 0);

        });
    };

    _defaultView() {
        return(
            iOS ?
                <BlurView style={styles.iOSBlur}
                          blurType="light"
                          blurAmount={5}
                >
                    <Text style={styles.textStyle}>
                        {hintText}
                    </Text>
                    <Button
                        backgroundColor={COLORS.appColor}
                        raised
                        borderRadius={5}
                        title='点我寻找!'
                        animationType="bounceInLeft"
                        onPress = {this._onPress}
                    />
                </BlurView>
                :
                <View style={styles.blurViewStyle}>
                    {this.viewRef &&
                    <BlurView blurType="light"
                              blurAmount={5}
                              style={styles.AndroidBlur}
                              viewRef={this.viewRef}
                    />}
                        <Text style={styles.textStyle}>
                            {hintText}
                        </Text>
                        <Button
                            backgroundColor={COLORS.appColor}
                            raised
                            borderRadius={5}
                            title='点我寻找!'
                            animationType="bounceInLeft"
                            onPress = {this._onPress}
                        />
                </View>
        )
    }

    _findView () {
        return(
            iOS
                ?
                <BlurView blurType="light"
                      blurAmount={5}
                      style={styles.iOSBlur}
                >
                    <Progress.Circle
                        showsText={true}
                        color = {COLORS.appColor}
                        progress={this.perent}
                        size={130}
                        formatText={()=>{
                                            return(
                                                <Text style={{fontSize:FONT_SIZE(17)}}>
                                                    正在查找
                                                </Text>
                                            )
                                        }}
                    />
                </BlurView>
                :
                <View style={styles.blurViewStyle}>
                    {this.viewRef &&
                    <BlurView blurType="light"
                              blurAmount={5}
                              style={styles.AndroidBlur}
                              viewRef={this.viewRef}
                    />}
                    <Progress.Circle
                        showsText={true}
                        color = {COLORS.appColor}
                        progress={this.perent}
                        size={130}
                        style={styles.progressStyle}
                        formatText={()=>{
                                            return(
                                                <Text style={{fontSize:FONT_SIZE(17)}}>
                                                    正在查找
                                                </Text>
                                            )
                                        }}
                    />

                </View>
        )
    }

    render() {
        console.log('render');

        return (
            <View style={styles.container}>
                <Image
                       source={{uri:imageUri}}
                       style={[styles.image]}
                       animation="fadeIn"
                       ref={image => this.backgroundImage = image}
                       onLoadEnd={() => this._imageOnLoaded()}
                />

                    <StatusBar
                        backgroundColor="#4ECBFC"
                        translucent={true}
                        barStyle="light-content"
                    />
                    {
                        !this.isUpload
                            ?
                            this._defaultView()
                            :
                            this._findView()
                    }

            </View>
        );
    };

}


const styles = StyleSheet.create({
    container: {
        // flex: 1,
        justifyContent: 'center',
        backgroundColor:'white',
    },
    image:{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: -1,
        right: 0,
        // resizeMode: 'cover',
        width: null,
        height: null,
    },
    iOSBlur:{
        width:SCREEN_WIDTH,
        height:SCREEN_HEIGHT - 64 - 49,
        alignItems:'center',
        justifyContent: 'center',
    },
    AndroidBlur:{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        right: 0,
    },
    blurViewStyle:{
        width:SCREEN_WIDTH,
        height:SCREEN_HEIGHT,
        alignItems:'center',
        justifyContent:'center',
        // alignSelf:'center',
        // alignContent:'center',
    },
    textStyle:{
        fontSize:iOS?FONT_SIZE(18):FONT_SIZE(22),
        color:'black',
        marginBottom:20
    },
    progressStyle:{
        alignItems:'center',
        justifyContent:'center',
        alignSelf:'center',
        alignContent:'center',
    }
});

// const mapStateToProps = (state) => {
//     const { ShiTuReducer } = state;
//     return {
//         ShiTuReducer
//     };
// };
//
// const mapDispatchToUserToken = (dispatch) => {
//     const userActions = bindActionCreators(User, dispatch);
//     return {
//         userActions
//     };
// };
//
// const mapDispatchToQiNiuToken = (dispatch) => {
//     const qiNiuActions = bindActionCreators(QiNiu, dispatch);
//     return {
//         qiNiuActions
//     };
// };
//
// export default connect(mapStateToProps,mapDispatchToUserToken,mapDispatchToQiNiuToken)(ShiTu)

export default connect((state) => {
    const { ShiTuReducer } = state;
    const routes  = state.nav.routes;
    return {
        ShiTuReducer,
        routes
    };
},{ userToken, qiNiuToken, backImage,getQiNiuToken,getPerent,getBackImage})(ShiTu)

//这里是绑定 一共2个参数 第一个是 state 第二个是 方法 方法有很多方式 我这样的是比较方便的 不需要引用dispatch来调方法
//在别的页面想使用同样的 state 或者 调用相同的方法 改值 一样的connect
//这个state 是整个 状态树 里面还有很多 取决于你的 reducers
// export default connect((state) => {
//     const { ShiTuReducer } = state;
//     return {
//         ShiTuReducer
//     };
// },  dispatch => bindActionCreators({userToken, qiNiuToken, backImage,getQiNiuToken}, dispatch),)(ShiTu)