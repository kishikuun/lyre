/**
 * Lyre Studio - Curated Lessons Library (js/curated-lessons.js)
 * 6 Built-in High Quality English Lessons across CEFR Levels A2 to C1
 * Eliminates zero-content friction and provides instant 1-click learning.
 */
(function (root) {
    'use strict';

    const CURATED_LESSONS = [
        {
            id: 'lesson-a2-hotel',
            title: 'Calling to Book a Hotel',
            level: 'A2',
            levelLabel: 'Elementary',
            category: 'Daily Life',
            accent: 'American English',
            wpm: 130,
            description: 'Tình huống gọi điện đặt phòng khách sạn, làm quen với số phòng, giá cả và thông tin cá nhân cơ bản.',
            sentences: [
                {
                    id: 1,
                    start: 0.0,
                    end: 3.8,
                    duration: 3.8,
                    text: 'Good morning, Grand Hotel reservation desk, how may I help you today?',
                    translation: 'Xin chào, quầy đặt phòng khách sạn Grand Hotel xin nghe, tôi có thể giúp gì cho bạn hôm nay?',
                    keywords: ['reservation', 'desk']
                },
                {
                    id: 2,
                    start: 4.2,
                    end: 8.5,
                    duration: 4.3,
                    text: 'Hello, I would like to book a double room for three nights starting next Friday.',
                    translation: 'Xin chào, tôi muốn đặt một phòng đôi trong ba đêm bắt đầu từ thứ Sáu tuần tới.',
                    keywords: ['double room', 'three nights']
                },
                {
                    id: 3,
                    start: 9.0,
                    end: 13.6,
                    duration: 4.6,
                    text: 'Certainly sir, let me check our computer system to see if we have rooms available.',
                    translation: 'Chắc chắn rồi thưa quý khách, để tôi kiểm tra hệ thống máy tính xem còn phòng trống hay không.',
                    keywords: ['available', 'system']
                },
                {
                    id: 4,
                    start: 14.1,
                    end: 18.8,
                    duration: 4.7,
                    text: 'Yes, we have a deluxe room on the fifth floor with a wonderful city view.',
                    translation: 'Vâng, chúng tôi có một phòng deluxe ở tầng năm với tầm nhìn ngắm thành phố rất tuyệt.',
                    keywords: ['deluxe', 'city view']
                },
                {
                    id: 5,
                    start: 19.3,
                    end: 23.4,
                    duration: 4.1,
                    text: 'The rate is one hundred and twenty dollars per night, including complimentary breakfast.',
                    translation: 'Giá phòng là một trăm hai mươi đô la mỗi đêm, đã bao gồm bữa sáng miễn phí.',
                    keywords: ['complimentary', 'breakfast']
                },
                {
                    id: 6,
                    start: 24.0,
                    end: 28.5,
                    duration: 4.5,
                    text: 'That sounds perfect, could you please reserve it under the name of Sarah Jenkins?',
                    translation: 'Nghe thật hoàn hảo, bạn có thể vui lòng đặt phòng dưới tên Sarah Jenkins được không?',
                    keywords: ['perfect', 'reserve']
                }
            ]
        },
        {
            id: 'lesson-b1-interview',
            title: 'Job Interview Strategy',
            level: 'B1',
            levelLabel: 'Intermediate',
            category: 'Career & Workplace',
            accent: 'American English',
            wpm: 140,
            description: 'Chiến lược trả lời phỏng vấn xin việc bằng tiếng Anh chuyên nghiệp về điểm mạnh và kỹ năng làm việc nhóm.',
            sentences: [
                {
                    id: 1,
                    start: 0.0,
                    end: 4.2,
                    duration: 4.2,
                    text: 'Could you tell us about a time when you had to manage a difficult project deadline?',
                    translation: 'Bạn có thể chia sẻ về một lần bạn phải xử lý hạn chót dự án khó khăn không?',
                    keywords: ['manage', 'deadline']
                },
                {
                    id: 2,
                    start: 4.7,
                    end: 9.4,
                    duration: 4.7,
                    text: 'In my previous position, our team had only two weeks to launch a complete marketing campaign.',
                    translation: 'Ở vị trí trước đây của tôi, nhóm chúng tôi chỉ có hai tuần để khởi động cả một chiến dịch tiếp thị.',
                    keywords: ['previous position', 'marketing campaign']
                },
                {
                    id: 3,
                    start: 9.9,
                    end: 14.5,
                    duration: 4.6,
                    text: 'I immediately organized daily standup meetings to identify blockers and delegate key tasks.',
                    translation: 'Tôi đã tổ chức ngay các cuộc họp giao ban hàng ngày để tìm ra các vướng mắc và ủy thác các nhiệm vụ trọng tâm.',
                    keywords: ['standup meetings', 'delegate']
                },
                {
                    id: 4,
                    start: 15.0,
                    end: 19.6,
                    duration: 4.6,
                    text: 'By prioritizing high impact milestones, we delivered the final product three days ahead of schedule.',
                    translation: 'Nhờ ưu tiên các cột mốc có tầm ảnh hưởng lớn, chúng tôi đã bàn giao sản phẩm cuối cùng sớm hơn kế hoạch ba ngày.',
                    keywords: ['prioritizing', 'milestones']
                },
                {
                    id: 5,
                    start: 20.1,
                    end: 24.5,
                    duration: 4.4,
                    text: 'That experience taught me the critical importance of transparent communication and adaptability under pressure.',
                    translation: 'Kinh nghiệm đó đã dạy tôi tầm quan trọng sống còn của việc giao tiếp minh bạch và khả năng thích ứng dưới áp lực.',
                    keywords: ['transparent', 'adaptability']
                },
                {
                    id: 6,
                    start: 25.0,
                    end: 29.8,
                    duration: 4.8,
                    text: 'I am confident that these skills will allow me to make an immediate contribution to your department.',
                    translation: 'Tôi tự tin rằng những kỹ năng này sẽ giúp tôi đóng góp tích cực ngay lập tức cho phòng ban của bạn.',
                    keywords: ['confident', 'contribution']
                }
            ]
        },
        {
            id: 'lesson-b2-ai',
            title: 'How Artificial Intelligence Works',
            level: 'B2',
            levelLabel: 'Upper-Intermediate',
            category: 'Technology & Science',
            accent: 'Standard International',
            wpm: 150,
            description: 'Giải thích cơ chế hoạt động của trí tuệ nhân tạo, mạng nơ-ron và cách máy tính tự học từ dữ liệu.',
            sentences: [
                {
                    id: 1,
                    start: 0.0,
                    end: 4.5,
                    duration: 4.5,
                    text: 'Artificial intelligence is fundamentally transforming how software systems interact with human language and visual patterns.',
                    translation: 'Trí tuệ nhân tạo về cơ bản đang biến đổi cách thức các hệ thống phần mềm tương tác với ngôn ngữ loài người và các mô thức thị giác.',
                    keywords: ['fundamentally', 'transforming']
                },
                {
                    id: 2,
                    start: 5.0,
                    end: 9.8,
                    duration: 4.8,
                    text: 'Rather than following rigid handcrafted rules, modern models learn statistical correlations from vast datasets.',
                    translation: 'Thay vì tuân theo các quy tắc thủ công cứng nhắc, các mô hình hiện đại tự học các tương quan thống kê từ các bộ dữ liệu khổng lồ.',
                    keywords: ['statistical', 'correlations']
                },
                {
                    id: 3,
                    start: 10.3,
                    end: 15.2,
                    duration: 4.9,
                    text: 'Neural networks are composed of interconnected mathematical layers that gradually extract meaningful abstract features.',
                    translation: 'Mạng nơ-ron được tạo thành từ các lớp toán học liên kết với nhau nhằm dần dần trích xuất các đặc trưng trừu tượng có ý nghĩa.',
                    keywords: ['interconnected', 'abstract features']
                },
                {
                    id: 4,
                    start: 15.7,
                    end: 20.4,
                    duration: 4.7,
                    text: 'During training, the algorithm repeatedly compares its predictions with ground truth answers to minimize computational error.',
                    translation: 'Trong quá trình huấn luyện, thuật toán liên tục so sánh các dự đoán với đáp án thực tế để tối thiểu hóa sai số tính toán.',
                    keywords: ['predictions', 'ground truth']
                },
                {
                    id: 5,
                    start: 20.9,
                    end: 25.5,
                    duration: 4.6,
                    text: 'This continuous optimization process enables speech recognition, language translation, and automated medical diagnosis.',
                    translation: 'Quá trình tối ưu hóa liên tục này tạo tiền đề cho nhận dạng giọng nói, dịch ngôn ngữ và chẩn đoán y tế tự động.',
                    keywords: ['optimization', 'diagnosis']
                },
                {
                    id: 6,
                    start: 26.0,
                    end: 30.6,
                    duration: 4.6,
                    text: 'As computational power expands, responsible deployment and ethical transparency remain paramount challenges for society.',
                    translation: 'Khi sức mạnh điện toán mở rộng, việc triển khai có trách nhiệm và tính minh bạch đạo đức vẫn là thách thức hàng đầu đối với xã hội.',
                    keywords: ['transparency', 'paramount']
                }
            ]
        },
        {
            id: 'lesson-c1-oceans',
            title: 'The Mystery of Deep Oceans',
            level: 'C1',
            levelLabel: 'Advanced Academic',
            category: 'Marine Biology & Nature',
            accent: 'British English',
            wpm: 155,
            description: 'Văn phong học thuật mô tả thế giới biển sâu, sinh vật phát quang và những bí ẩn chưa từng được khám phá.',
            sentences: [
                {
                    id: 1,
                    start: 0.0,
                    end: 4.8,
                    duration: 4.8,
                    text: 'Beneath the twilight boundary of the pelagic zone lies the abyssal plain, an environment perpetually veiled in absolute darkness.',
                    translation: 'Bên dưới ranh giới tranh tối tranh sáng của vùng biển khơi là đồng bằng biển thẳm, một môi trường bị che phủ vĩnh viễn trong bóng tối tuyệt đối.',
                    keywords: ['twilight', 'perpetually', 'abyssal']
                },
                {
                    id: 2,
                    start: 5.3,
                    end: 10.2,
                    duration: 4.9,
                    text: 'Hydrostatic pressure at these monumental depths exceeds one thousand atmospheres, posing formidable obstacles to exploratory submersibles.',
                    translation: 'Áp suất thủy tĩnh ở những độ sâu kỳ vĩ này vượt quá một nghìn atmosphere, tạo ra những chướng ngại ghê gớm cho các tàu lặn thám hiểm.',
                    keywords: ['hydrostatic', 'formidable', 'submersibles']
                },
                {
                    id: 3,
                    start: 10.7,
                    end: 15.6,
                    duration: 4.9,
                    text: 'Remarkably, deep-sea organisms have evolved bioluminescent organs capable of emitting cold light to confuse predators or lure elusive prey.',
                    translation: 'Đáng chú ý là các sinh vật biển sâu đã tiến hóa các cơ quan phát quang sinh học có khả năng phát ra ánh sáng lạnh để đánh lạc hướng kẻ săn mồi hoặc nhử con mồi khó bắt.',
                    keywords: ['bioluminescent', 'predators', 'elusive']
                },
                {
                    id: 4,
                    start: 16.1,
                    end: 20.9,
                    duration: 4.8,
                    text: 'Hydrothermal vents discharge superheated mineral plumes, supporting chemosynthetic ecosystems independent of solar photosynthesis.',
                    translation: 'Các miệng phun thủy nhiệt thải ra các luồng khoáng chất siêu nóng, nuôi dưỡng các hệ sinh thái hóa tổng hợp hoàn toàn độc lập với quang hợp mặt trời.',
                    keywords: ['hydrothermal', 'chemosynthetic', 'photosynthesis']
                },
                {
                    id: 5,
                    start: 21.4,
                    end: 26.2,
                    duration: 4.8,
                    text: 'These extreme habitats may hold the definitive genetic clues to the primordial origins of multicellular biological life on Earth.',
                    translation: 'Những môi trường sống cực đoan này có thể nắm giữ những manh mối di truyền quyết định về nguồn gốc nguyên thủy của sự sống sinh học đa bào trên Trái Đất.',
                    keywords: ['definitive', 'primordial', 'multicellular']
                },
                {
                    id: 6,
                    start: 26.7,
                    end: 31.8,
                    duration: 5.1,
                    text: 'Despite technological advancements, less than a fraction of one percent of our ocean floors has been mapped with meticulous precision.',
                    translation: 'Bất chấp những tiến bộ về công nghệ, chưa đầy một phần nhỏ của một phần trăm đáy đại dương của chúng ta được lập bản đồ với độ chính xác tỉ mỉ.',
                    keywords: ['advancements', 'meticulous', 'precision']
                }
            ]
        },
        {
            id: 'lesson-ielts-library',
            title: 'Campus Library Registration',
            level: 'IELTS',
            levelLabel: 'Listening Section 1',
            category: 'Academic Preparation',
            accent: 'British English',
            wpm: 145,
            description: 'Luyện đề IELTS Listening Phần 1: Đối thoại đăng ký thẻ thư viện đại học, bắt số điện thoại, mã sinh viên và quy định mượn sách.',
            sentences: [
                {
                    id: 1,
                    start: 0.0,
                    end: 4.4,
                    duration: 4.4,
                    text: 'Welcome to the university central library, are you looking to register for your student borrowing card?',
                    translation: 'Chào mừng bạn đến với thư viện trung tâm đại học, bạn đang muốn đăng ký thẻ mượn sách cho sinh viên phải không?',
                    keywords: ['central library', 'borrowing card']
                },
                {
                    id: 2,
                    start: 4.9,
                    end: 9.3,
                    duration: 4.4,
                    text: 'Yes please, I am a first year postgraduate student in the Department of Mechanical Engineering.',
                    translation: 'Vâng đúng vậy, tôi là sinh viên cao học năm nhất thuộc Khoa Kỹ thuật Cơ khí.',
                    keywords: ['postgraduate', 'Mechanical Engineering']
                },
                {
                    id: 3,
                    start: 9.8,
                    end: 14.2,
                    duration: 4.4,
                    text: 'Excellent, I will just need your student identification number and proof of current residential address.',
                    translation: 'Tuyệt vời, tôi sẽ chỉ cần mã số sinh viên của bạn và giấy tờ chứng minh địa chỉ cư trú hiện tại.',
                    keywords: ['identification', 'residential address']
                },
                {
                    id: 4,
                    start: 14.7,
                    end: 19.5,
                    duration: 4.8,
                    text: 'My student ID is ME-eight-nine-four-two, and here is my campus accommodation tenancy agreement.',
                    translation: 'Mã sinh viên của tôi là ME-8942, và đây là hợp đồng thuê nhà ký túc xá trong khuôn viên trường của tôi.',
                    keywords: ['student ID', 'accommodation']
                },
                {
                    id: 5,
                    start: 20.0,
                    end: 24.6,
                    duration: 4.6,
                    text: 'Thank you, your card entitles you to borrow up to twelve books for a standard period of four weeks.',
                    translation: 'Cảm ơn bạn, thẻ của bạn cho phép bạn mượn tối đa mười hai cuốn sách trong thời hạn tiêu chuẩn là bốn tuần.',
                    keywords: ['entitles', 'standard period']
                },
                {
                    id: 6,
                    start: 25.1,
                    end: 29.8,
                    duration: 4.7,
                    text: 'Please remember that late renewals incur a fee of fifty pence per item each day past the due date.',
                    translation: 'Xin lưu ý rằng việc gia hạn trễ sẽ chịu mức phí phạt năm mươi xu cho mỗi tài liệu đối với mỗi ngày quá hạn.',
                    keywords: ['renewals', 'due date']
                }
            ]
        },
        {
            id: 'lesson-phonics-flapt',
            title: 'Connected Speech & Flap T',
            level: 'Pronunciation',
            levelLabel: 'Speech Rhythm & Flap T',
            category: 'Acoustic Mastery',
            accent: 'American English',
            wpm: 135,
            description: 'Luyện phản xạ nghe nối âm, nuốt âm và biến âm Flap T (water -> wader, city -> cidy) đặc trưng của người bản ngữ Mỹ.',
            sentences: [
                {
                    id: 1,
                    start: 0.0,
                    end: 4.0,
                    duration: 4.0,
                    text: 'Could you pass me a little bottle of cold water from the refrigerator?',
                    translation: 'Bạn có thể đưa cho tôi một chai nước lạnh nhỏ từ tủ lạnh được không?',
                    keywords: ['bottle', 'water', 'refrigerator']
                },
                {
                    id: 2,
                    start: 4.5,
                    end: 8.8,
                    duration: 4.3,
                    text: 'It is a matter of fact that native speakers rarely pronounce every single letter clearly.',
                    translation: 'Có một thực tế là người bản ngữ hiếm khi phát âm từng chữ cái một cách rành mạch.',
                    keywords: ['matter of fact', 'rarely pronounce']
                },
                {
                    id: 3,
                    start: 9.3,
                    end: 13.5,
                    duration: 4.2,
                    text: 'When a T sound occurs between two vowels, it frequently changes into a quick voiced tap.',
                    translation: 'Khi âm T nằm giữa hai nguyên âm, nó thường biến đổi thành một âm vỗ thanh quản nhanh.',
                    keywords: ['vowels', 'voiced tap']
                },
                {
                    id: 4,
                    start: 14.0,
                    end: 18.2,
                    duration: 4.2,
                    text: 'Words like city, better, writer, and meeting demonstrate this natural acoustic rhythm.',
                    translation: 'Những từ như city, better, writer và meeting thể hiện rõ nhịp điệu âm học tự nhiên này.',
                    keywords: ['demonstrate', 'acoustic rhythm']
                },
                {
                    id: 5,
                    start: 18.7,
                    end: 23.0,
                    duration: 4.3,
                    text: 'Notice also how the word of connects smoothly to the following vowel sound.',
                    translation: 'Hãy chú ý cách từ "of" nối âm một cách mượt mà sang nguyên âm đứng liền kề phía sau.',
                    keywords: ['smoothly', 'vowel sound']
                },
                {
                    id: 6,
                    start: 23.5,
                    end: 28.0,
                    duration: 4.5,
                    text: 'Mastering these phonetic links will dramatically improve your listening comprehension speed.',
                    translation: 'Nắm vững các mắt xích ngữ âm này sẽ cải thiện đáng kể tốc độ nghe hiểu của bạn.',
                    keywords: ['phonetic links', 'comprehension speed']
                }
            ]
        }
    ];

    function getAllLessons() {
        return CURATED_LESSONS.slice();
    }

    function getLessonById(id) {
        if (!id) return null;
        return CURATED_LESSONS.find(item => item.id === id) || null;
    }

    root.App = root.App || {};
    root.App.CuratedLessons = {
        getAllLessons,
        getLessonById
    };

})(typeof window !== 'undefined' ? window : this);

