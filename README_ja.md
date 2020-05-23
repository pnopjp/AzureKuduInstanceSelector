# Instance selector for Azure App Service Kudu

Azure App Serviceでインスタンスを指定してKuduやコンソールを開くGoogle Chromeエクステンションです。

複数インスタンスが稼働しているAzure App Service for Linuxでは、意図したインスタンスに対してSSH接続をすることが難しいです。
このChromeエクステンションは、それを容易にします。

![Screen Shot](Chrome%20Web%20Store/screenshot.png)

## 特徴

- 指定したインスタンスへのSSH接続
- 指定したインスタンスのKudu\(高度なツール\)にアクセス

## 動作環境

- Google Chrome or Microsoft Edge(Chromium base)

## インストール

[![Chrome Web Store - Instance Selector for Azure App Service Kudu](https://developer.chrome.com/webstore/images/ChromeWebStore_BadgeWBorder_v2_206x58.png)](https://chrome.google.com/webstore/detail/instance-selector-for-azu/epdffjkaaohfjahphbancbnaiilkonel)

## 利用方法

1. Azure PortalでSSH接続やKuduを開きたいApp ServiceあるいはFunctionsのページを開きます。
1. Google Chromeで拡張機能アイコン ![Launch Azure Kudu](/src/icon/icon16.png) \(Launch Azure Kudu\) をクリックします。
1. 対象インスタンスの「Kudu」あるいは「console」ボタンをクリックします。

## ライセンス

このプロジェクトは MIT ライセンスの元にライセンスされています。 詳細は[LICENSE](LICENSE)をご覧ください。

## Copyright

&copy; 2020 株式会社 pnop All rights reserved.
