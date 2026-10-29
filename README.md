# DictaShadow Studio TP-7

> **Swiss Editorial Acoustic Studio for English Dictation & Shadowing**  
> *100% Pure Client-Side HTML5 / Web Audio API / Canvas 2D / PWA Offline*

---

## 🎧 Giới Thiệu Tổng Quan (Overview)

**DictaShadow Studio TP-7** là ứng dụng web cao cấp hỗ trợ người học tiếng Anh luyện **Nghe Chép Chính Tả (Dictation)** và **Nói Đuổi Âm Học (Shadowing)** chuyên sâu. 

Ứng dụng được thiết kế hoàn toàn theo phong cách thẩm mỹ **Swiss Editorial Acoustic Studio** (Lấy cảm hứng từ thiết bị thu âm cơ học Thụy Sĩ Nagra/Studer, phím cơ xúc giác, dải sóng quang học và kiểu chữ biên tập cổ điển), xóa bỏ hoàn toàn giao diện màu tím/xanh neon đại trà của các website thông thường.

---

## ✨ Điểm Nhấn Bản Sắc (Signature Features)

### 1. Máy Đánh Chữ Quang Học & Chép Chính Tả (Optical Typewriter & Dictation)
- **2 Chế độ Luyện Gõ:**
  - **Chép Chính Tả Chuẩn (Standard Manuscript):** Khung gõ biên tập khổ rộng, hỗ trợ gợi ý ký tự, tự động thống kê số từ và tính toán độ chuẩn xác theo thuật toán quy hoạch động LCS (Longest Common Subsequence).
  - **Điền Từ Masked Flow (Optical Flow):** Chế độ điền từng từ với con trỏ laser hổ phách (**Laser Caret**), các từ tương lai được che bằng gạch bảo mật `— — —` chống nhìn trước đáp án.
- **Chế độ Thiền Định (Zen Focus Mode):** Khi con trỏ chuột kích hoạt vào khung gõ, toàn bộ thanh công cụ và ngoại cảnh tự động mờ xuống 20% và làm mờ nhẹ, triệt tiêu tạp âm thị giác giúp tập trung 100% vào việc nghe và gõ.
- **Con Dấu Nhiệt & Tem Chất Lượng Đa Cấp (Embossed Quality Stamp):** Khi chấm bài (`Ctrl + Enter`), dải quang phổ nhiệt hổ phách lướt qua màn hình, đóng dấu chìm cơ học theo các cấp phân hạng:
  - `GRADE S`: $\ge 95\%$ (Ngọc bích · Hoàn hảo)
  - `GRADE A`: $85 - 94\%$ (Hổ phách · Rất tốt)
  - `GRADE B`: $70 - 84\%$ (Titanium · Đạt chuẩn)
  - `GRADE C`: $< 70\%$ (Đỏ thẫm · Cần luyện lại)
- **Phản hồi Âm Thanh Cơ Khí 0ms:** Tích hợp bộ tổng hợp âm thanh bàn phím cơ bằng Web Audio API (tiếng gõ chữ `tick`, tiếng nảy thanh spacebar `typewriter-space`, tiếng chuông reo sang trang `carriage-return`) với nút bật/tắt xúc giác `[ 🔊 Âm Cơ: BẬT/TẮT ]`.

---

### 2. Phòng Thu Thử Âm Âm Học (Harmonic Resonance Shadowing Lab)
- **Dải Sóng Kép (Twin Acoustic Ribbons):**
  - **Track A (Bản Xứ):** Dải sóng hổ phách quang học (*Optical Amber Gold*).
  - **Track B (Giọng Bạn):** Dải sóng ngọc bích (*Sage Emerald*).
  - **Thước Khắc Thời Gian (Acoustic Time Ruler):** Thước đo miligiây chia vạch cơ học giữa hai rãnh sóng.
- **Cò Bấm Màn Trập Leica (Leica Shutter Record Button):** Nút thu âm cơ học tiện khía với âm thanh màn trập đanh giòn khi ấn phím `R`.
- **Cộng Hưởng Hòa Âm (Harmonic Resonance Bloom):** Khi nhịp điệu $\ge 80\%$ và cao độ $\ge 75\%$, dải sóng kích hoạt hiệu ứng thở hào quang và ngân vang hợp âm bội âm 4 nốt.
- **Đường Lượn Cao Độ $F_0$ (Pitch Contour Overlay):** Trích xuất tần số cơ bản của giọng nói qua thuật toán Autocorrelation và vẽ trực quan đường lượn ngữ điệu lên/xuống để học viên so khớp ngữ điệu với người bản xứ.
- **Kênh Đôi L/R (Binaural Stereo Contrast - Phím S):**
  - Tai trái (Pan = -0.85): Giọng bản xứ.
  - Tai phải (Pan = +0.85): Giọng của bạn.
  - Giúp phát hiện sai biệt micro-intonation qua không gian âm học nổi 3D.
- **Lật Kênh Tức Thì (Instant A/B Flip - Phím A):** Chuyển đổi giữa giọng bản xứ và giọng bạn ngay tại vị trí miligiây đang phát mà không ngắt quãng.
- **Bảng Luyện Ngữ Điệu Oxford (Prosody Teleprompter):** Nhận diện từ mang trọng âm, ký hiệu nối âm (`‿`), ngắt hơi (`/`, `//`) và hướng cao độ cuối câu (`↗`, `↘`).
- **Chế Độ Luyện Tai Ẩn Chữ (Blind Shadowing - Phím B):** Làm mờ mờ kính sương toàn bộ văn bản để rèn luyện phản xạ thính giác thuần túy.
- **Quy Trình 4 Bước Chuẩn Sư Phạm:** Nghe nhịp $\to$ Mute môi $\to$ Nói đuổi $\to$ Thẩm âm đối chiếu.

---

### 3. Công Thái Học Phím Tắt 1 Chạm (Ergonomic Hotkeys)

| Phím Tắt | Thao Tác Nhanh | Mô Tả |
| :--- | :--- | :--- |
| **ESC** | Dừng / Phát tiếp | 1 chạm ngón út cực nhanh, không cần giữ Ctrl |
| **TAB** | Tua lùi 2 giây | Nghe lại ngay cụm từ vừa qua |
| **Shift + TAB** | Tua tiến 2 giây | Lướt nhanh qua đoạn thừa |
| **F4** | Nghe lại từ đầu câu | Replay segment lập tức |
| **Ctrl + Enter** | Chấm điểm bài gõ | Quét nhiệt và đóng dấu phân hạng |
| **F5** | Mở / Đóng phụ đề | Ẩn hiện bản thảo đối chiếu |
| **R** | Bật / Tắt thu âm | Cò bấm màn trập Leica |
| **S** | Kênh đôi L/R | Tai trái mẫu, tai phải bạn |
| **A** | Lật kênh A / B | So sánh tức thì tại mốc phát |
| **P** | Bật / Tắt đường Pitch $F_0$ | Đối chiếu đường cong ngữ điệu |
| **B** | Blind Mode | Ẩn / hiện chữ luyện tai |

---

### 4. Khay Thiết Bị Thu Gọn (Collapsible Audio Rack Tray)
- **Audio Gain Booster:** Khuếch đại âm lượng lên đến 400% thông qua Web Audio `GainNode` + `DynamicsCompressorNode`, cứu cánh cho các file ghi âm bài nghe chất lượng thấp.
- **Smart Smoothing Padding (±300ms):** Tự động mở rộng 300ms hai đầu câu kết hợp phong bì âm học 80ms fade-in/fade-out, triệt tiêu tiếng click/pop khó chịu khi cắt lát âm thanh.
- **Cử chỉ cảm ứng Mobile:** Hỗ trợ vuốt trái sang câu kế, vuốt phải về câu trước, chạm đúp 2 ngón tay dừng/phát.
- **Offline 100% (PWA & IndexedDB):** Tự động lưu bản thu âm và tiến độ học tập trong trình duyệt qua IndexedDB, hoạt động hoàn toàn độc lập không cần kết nối mạng.

---

## 📁 Cấu Trúc Mã Nguồn (Strictly < 850 lines/file)

Tất cả các tệp đều được phân tách rõ ràng và nằm **sâu dưới giới hạn 2.000 dòng**:

```
dictation/
├── index.html              # Bộ khung giao diện duy nhất (791 dòng)
├── manifest.json           # Cấu hình PWA cài đặt độc lập
├── package.json            # Tiêu chuẩn gói Node.js (scripts: start, test)
├── server.js               # Máy chủ HTTP phục vụ tĩnh gọn nhẹ (29 dòng)
├── sw.js                   # Service Worker bộ nhớ đệm Offline (62 dòng)
├── test-10-checks.js       # Bộ 10 bài kiểm thử tự động toàn diện (238 dòng)
├── RevTest_Track 01_04.mp3 # Tệp âm thanh mẫu
├── RevTest_Track 01_04.srt # Tệp phụ đề mẫu
├── css/
│   └── studio.css          # Hệ thống Design Tokens & CSS tùy biến (522 dòng)
└── js/
    ├── app.js              # Khởi tạo và điều phối luồng ứng dụng (525 dòng)
    ├── audio-engine.js     # Động cơ Web Audio DSP & âm thanh tổng hợp (651 dòng)
    ├── dictation.js        # Động cơ máy đánh chữ & chấm điểm (409 dòng)
    ├── diff-checker.js     # Thuật toán LCS so khớp từng từ (116 dòng)
    ├── gestures.js         # Nhận diện cử chỉ cảm ứng di động (86 dòng)
    ├── hotkeys.js          # Trình quản lý phím tắt công thái học (137 dòng)
    ├── shadowing.js        # Phòng thu Shadowing & Dải sóng kép (817 dòng)
    ├── speech-analysis.js  # Trích xuất Pitch F0 & Ngữ điệu Oxford (290 dòng)
    ├── srt-editor.js       # Trình tinh chỉnh mốc thời gian phụ đề (180 dòng)
    ├── srt-parser.js       # Phân tích định dạng SubRip SRT (65 dòng)
    ├── state.js            # Quản lý trạng thái trung tâm Reactive (73 dòng)
    ├── storage.js          # Lưu trữ cục bộ IndexedDB & LocalStorage (168 dòng)
    └── vinyl-jog.js        # Đĩa xoay Jog Dial xúc giác (77 dòng)
```

---

## 🚀 Hướng Dẫn Sử Dụng (Quick Start)

### Cách 1: Sử dụng máy chủ Node.js (Khuyên dùng)
```bash
# 1. Chạy máy chủ tĩnh
npm start
# Hoặc: node server.js

# 2. Mở trình duyệt tại:
http://localhost:8080/index.html
```

### Cách 2: Chạy kiểm thử tự động 10 tình huống
```bash
npm test
# Hoặc: node test-10-checks.js
```

### Cách 3: Mở trực tiếp không cần cài đặt
Nhấp đúp chuột vào file `index.html` trong bất kỳ trình duyệt hiện đại nào (Chrome, Edge, Safari, Firefox). Ứng dụng chạy 100% phía client!
