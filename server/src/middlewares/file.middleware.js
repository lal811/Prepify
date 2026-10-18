import multer from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const fileFilter = (req, file, cb) => {
    // Check MIME type and original filename extension
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfExt = file.originalname.toLowerCase().endsWith('.pdf');

    if (isPdfMime || isPdfExt) {
        cb(null, true);
    } else {
        const error = new Error('Only PDF files (.pdf) are allowed for resume upload.');
        error.name = 'MulterError';
        error.code = 'INVALID_FILE_TYPE';
        cb(error, false);
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    },
    fileFilter
});

export default upload;