document.addEventListener("deviceready", async function() {
  // BaaS@rakuzaを初期化
  RKZ.config.appAuthUsername = "<配布したアプリ認証ID>";
  RKZ.config.appAuthPassword = "<配布したアプリ認証パスワード>";
  await RKZ.init("<配布したテナントキー>");

  // BaaS@rakuzaからアプリケーション設定を取得
  const appSettings = await RKZ.appSettings();

  // ユーザーアクセストークンを取得（なければ、ユーザーを新規作成）
  let userAccessToken = localStorage.getItem("userAccessToken");
  if (!userAccessToken) {
    const newUser = await RKZ.User.register({ attributes: {} });
    userAccessToken = newUser.user_access_token;
    localStorage.setItem("userAccessToken", userAccessToken);
  }

  // NCMBサービス終了フラグがオフの場合に、デバイストークンを送信する
  if (appSettings.attributes.ncmb_end_flg !== "1") {
    NCMB.monaca.setDeviceToken(
      "<NCMBのアプリケーションキー>",
      "<NCMBのクライアントキー>"
    );
  }

  // プラグインの初期化
  var push = PushNotification.init({
    android: {},
    ios: {
      alert: true,
      badge: true,
      sound: true
    }
  });

  // デバイストークン取得時のイベント
  push.on("registration", async function(data) {
    console.debug(data);
    document.getElementById("message").textContent = "cordova-plugin-push:" + data.registrationId;

    // デバイストークンが異なる場合、各BaaSにデバイストークンを送信する
    if (data.registrationId !== localStorage.getItem("deviceToken")) {
      // NCMBにデバイストークンを送信する
      if (appSettings.attributes.ncmb_end_flg !== "1") {
        NCMB.monaca.setAPNSDeviceToken(data.registrationId, function() {});
      }

      // BaaS@rakuzaにデバイストークンを送信する
      await RKZ.User.registerPushDeviceToken(userAccessToken, data.registrationId);

      // デバイストークンを永続化して、次回起動時に比較する
      localStorage.setItem("deviceToken", data.registrationId);
    }
  });

  // プッシュ通知受信時のイベント
  push.on("notification", function(data) {
    alert("notification :::" + JSON.stringify(data));
  });
},false);
