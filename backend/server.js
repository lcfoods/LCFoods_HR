
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- MOCK DATABASE (In-Memory) ---
// Trong thực tế, bạn sẽ thay cái này bằng kết nối tới MongoDB, PostgreSQL hoặc Firebase
const DB = {
    users: [
        { id: 'user_1', username: 'nhanvien', password: '123', name: 'Nguyễn Văn A', role: 'STAFF', companyId: 'c1' },
        { id: 'user_2', username: 'admin', password: '123', name: 'Admin User', role: 'ADMIN', companyId: 'c1' }
    ],
    courses: [
        {
            id: 'course_excel_01',
            title: 'Tuyệt đỉnh Excel - Trở thành bậc thầy báo cáo',
            description: 'Khóa học giúp bạn làm chủ Excel từ cơ bản đến nâng cao.',
            instructor: 'Nguyễn Thành Bằng',
            level: 'Intermediate',
            thumbnail: 'https://images.unsplash.com/photo-1543286386-713df548e9cc',
            totalDurationMinutes: 155,
            companyId: 'c1',
            sections: [
                {
                    id: 'sec_1',
                    title: 'Phần 1: Cơ bản',
                    lessons: [
                        { id: 'l_1', title: 'Giới thiệu', type: 'VIDEO', durationMinutes: 5, contentUrl: 'https://www.youtube.com/embed/RdTozKPY_4Q' }
                    ]
                }
            ]
        }
    ],
    progress: [] // { userId, courseId, lessonId, score, status }
};

// --- AUTHENTICATION ---

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = DB.users.find(u => (u.username === username || u.email === username) && u.password === password);
    
    if (user) {
        // Trả về user info (Trong thực tế nên trả về JWT Token)
        const { password, ...userWithoutPass } = user;
        res.json({ success: true, data: userWithoutPass });
    } else {
        res.status(401).json({ success: false, error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
});

// --- COURSES ---

// Lấy danh sách khóa học (Có lọc theo Company)
app.get('/api/courses', (req, res) => {
    const { companyId } = req.query;
    let courses = DB.courses;
    if (companyId) {
        courses = courses.filter(c => c.companyId === companyId);
    }
    res.json({ success: true, data: courses });
});

// Lấy chi tiết khóa học
app.get('/api/courses/:id', (req, res) => {
    const course = DB.courses.find(c => c.id === req.params.id);
    if (course) {
        res.json({ success: true, data: course });
    } else {
        res.status(404).json({ success: false, error: 'Course not found' });
    }
});

// --- PROGRESS & LEARNING ---

// Lấy tiến độ học tập của user
app.get('/api/progress', (req, res) => {
    const { userId, courseId } = req.query;
    if (!userId || !courseId) {
        return res.status(400).json({ success: false, error: 'Missing userId or courseId' });
    }

    // Tìm progress của user
    const userProgress = DB.progress.find(p => p.userId === userId && p.courseId === courseId);
    
    res.json({ success: true, data: userProgress || null });
});

// Cập nhật tiến độ (Hoàn thành bài học / Nộp bài thi)
app.post('/api/progress/update', (req, res) => {
    const { userId, courseId, lessonId, score } = req.body;
    
    let progress = DB.progress.find(p => p.userId === userId && p.courseId === courseId);
    
    if (!progress) {
        progress = {
            userId,
            courseId,
            status: 'In Progress',
            completedLessonIds: [],
            quizScores: {},
            lastAccessedLessonId: lessonId
        };
        DB.progress.push(progress);
    }

    // Cập nhật bài học cuối cùng đã xem
    progress.lastAccessedLessonId = lessonId;

    // Đánh dấu hoàn thành nếu chưa
    if (!progress.completedLessonIds.includes(lessonId)) {
        progress.completedLessonIds.push(lessonId);
    }

    // Nếu là bài thi (có điểm số)
    if (score !== undefined) {
        progress.quizScores[lessonId] = score;
    }

    res.json({ success: true, data: progress });
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API Ready for E-learning App`);
});
