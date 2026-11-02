[Uploading README.md…]()
# jobhunt-autofill# Job Application Autofill / 就活マイページ自動入力

A Chrome extension that automates repetitive data entry on Japanese job application portals.
就活サイトで何度も入力する個人情報を、ワンクリックで自動入力するChrome拡張機能です。

[English](#english) | [日本語](#日本語)

---

## English

### Overview
Job hunting in Japan means entering the same personal details (name, address, phone, birth date, education) into dozens of different application portals. This extension lets you save your details once and fill in each form with a single click.

### Features
- **Save once, fill anywhere:** applicant details are stored in the extension and applied to the current page with one click
- **Dedicated support for two major recruiting platforms:** `i-web` and `axol`
- **Generic fallback for other forms:** fields are matched by their labels, placeholders, and names, so many unsupported portals also work
- **Format adaptation:** splits postal codes, phone numbers, and email addresses across multiple fields, and handles dropdowns, radio buttons, and checkboxes
- **Custom dropdowns in the popup:** built with plain `div` elements because native `<select>` menus do not open reliably inside extension popups
- **Privacy-first:** data is saved only in `chrome.storage.local` and is never sent to an external server

### Fields
Name (kanji / kana), gender, birth date, postal code, address, phone numbers, email addresses, university, faculty, expected graduation date, seminar, and club / circle.

### Installation
1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select this folder.

### Usage
1. Click the extension icon and enter your details.
2. Click **保存する (Save)**.
3. Open an application form and click **自動入力する (Autofill)**.
4. The popup shows how many fields were filled. Always review the form before submitting.

### How it works
- `popup.html` / `popup.js` provide the settings UI and save data to `chrome.storage.local`.
- On autofill, `chrome.scripting.executeScript` injects a `fillForm` function into the active tab.
- `fillForm` detects the portal by hostname and form field names, then fills it in:
  1. `i-web` type
  2. `axol` type
  3. Generic label-based fallback
- Input and change events are dispatched after each fill so that the page's own scripts (including jQuery-based forms) recognize the values.

### Permissions
| Permission | Why |
| --- | --- |
| `storage` | Save your details in the browser |
| `activeTab` | Access only the tab you are currently on |
| `scripting` | Inject the autofill function into that tab |

### Project structure
```
manifest.json   Extension manifest (Manifest V3)
popup.html      Popup UI and styles
popup.js        Save / restore logic, custom dropdowns, autofill logic
```

### Limitations
- Only `i-web` and `axol` have dedicated handling; other portals rely on label matching and may fill only some fields.
- Portals can change their markup at any time, which may break field matching.
- Free-text questions (self-PR, motivation, etc.) are not handled.

---

## 日本語

### 概要
就活では、氏名、住所、電話番号、生年月日、学歴といった同じ情報を、企業ごとのマイページに何度も入力する必要があります。この拡張機能は、情報を一度保存しておけば、ワンクリックで各フォームに入力します。

### 機能
- **一度保存すれば使い回せる:** 応募者情報を保存し、開いているページへワンクリックで入力
- **主要な採用管理システムに専用対応:** `i-web` と `axol`
- **その他のフォームにも対応:** ラベル、プレースホルダー、name属性から項目を判定する汎用処理
- **フォーム形式の違いに対応:** 郵便番号、電話番号、メールアドレスの分割入力のほか、プルダウン、ラジオボタン、チェックボックスにも対応
- **自作プルダウン:** 拡張機能のポップアップ内ではネイティブの`<select>`が開かない場合があるため、`div`で実装
- **個人情報はブラウザ内のみ:** `chrome.storage.local`に保存し、外部サーバーには送信しません

### 入力できる項目
氏名（漢字・フリガナ）、性別、生年月日、郵便番号、住所、電話番号、メールアドレス、大学名、学部・学科、卒業予定、ゼミ・研究室、クラブ・サークル

### インストール方法
1. このリポジトリをダウンロードまたはクローンします。
2. Chromeで `chrome://extensions` を開きます。
3. 右上の **デベロッパーモード** をオンにします。
4. **パッケージ化されていない拡張機能を読み込む** をクリックし、このフォルダを選択します。

### 使い方
1. 拡張機能のアイコンをクリックし、情報を入力します。
2. **保存する** をクリックします。
3. 応募フォームを開き、**自動入力する** をクリックします。
4. 入力された件数が表示されます。送信前に必ず内容を確認してください。

### 仕組み
- `popup.html` と `popup.js` が設定画面を提供し、データを`chrome.storage.local`に保存します。
- 自動入力時は、`chrome.scripting.executeScript`で`fillForm`関数を現在のタブに注入します。
- `fillForm`はホスト名とフォームのname属性からサイトを判定し、次の順に処理します。
  1. `i-web`型
  2. `axol`型
  3. ラベル判定による汎用処理
- 入力のたびに`input`と`change`イベントを発火させ、jQueryを使うフォームを含め、ページ側のスクリプトにも値を認識させます。

### 権限
| 権限 | 用途 |
| --- | --- |
| `storage` | 入力情報をブラウザに保存 |
| `activeTab` | 現在開いているタブのみにアクセス |
| `scripting` | そのタブに自動入力の関数を注入 |

### ファイル構成
```
manifest.json   拡張機能の設定（Manifest V3）
popup.html      ポップアップのUIとスタイル
popup.js        保存・復元、自作プルダウン、自動入力の処理
```

### 制限事項
- 専用処理があるのは`i-web`と`axol`のみです。その他のサイトはラベル判定のため、一部の項目しか入力されない場合があります。
- サイト側のHTML構造が変わると、項目の判定が機能しなくなる可能性があります。
- 自己PRや志望動機などの自由記述には対応していません。
