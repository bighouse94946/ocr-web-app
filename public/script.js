// DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');
const previewImage = document.getElementById('previewImage');
const imageName = document.getElementById('imageName');
const imageSize = document.getElementById('imageSize');
const recognizeBtn = document.getElementById('recognizeBtn');
const resetBtn = document.getElementById('resetBtn');
const resultText = document.getElementById('resultText');
const resultModel = document.getElementById('resultModel');
const resultConfidence = document.getElementById('resultConfidence');
const resultTokens = document.getElementById('resultTokens');
const copyBtn = document.getElementById('copyBtn');
const newRecognitionBtn = document.getElementById('newRecognitionBtn');
const retryBtn = document.getElementById('retryBtn');
const errorMessage = document.getElementById('errorMessage');
const loadingText = document.getElementById('loadingText');
const progressFill = document.getElementById('progressFill');

let currentFile = null;

// 初始化事件监听器
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

function initializeEventListeners() {
    // 上传区域点击事件
    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
    }

    // 文件选择事件
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // 拖拽事件
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
    }

    // 按钮事件
    if (recognizeBtn) {
        recognizeBtn.addEventListener('click', startRecognition);
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', resetToUpload);
    }
    if (copyBtn) {
        copyBtn.addEventListener('click', copyTextToClipboard);
    }
    if (newRecognitionBtn) {
        newRecognitionBtn.addEventListener('click', resetToUpload);
    }
    if (retryBtn) {
        retryBtn.addEventListener('click', retryUpload);
    }

    // 阻止默认的拖拽行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, false);
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDragOver(e) {
    e.preventDefault();
    if (uploadArea) {
        uploadArea.classList.add('dragover');
    }
}

function handleDragLeave(e) {
    e.preventDefault();
    if (uploadArea) {
        uploadArea.classList.remove('dragover');
    }
}

function handleDrop(e) {
    e.preventDefault();
    if (uploadArea) {
        uploadArea.classList.remove('dragover');
    }
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (validateFile(file)) {
            currentFile = file;
            showPreview(file);
        }
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
        currentFile = file;
        showPreview(file);
    }
}

function validateFile(file) {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
        showError('请选择图片文件（JPG、PNG、GIF等格式）');
        return false;
    }

    // 检查文件大小（2MB）- 减小限制确保快速处理
    if (file.size > 2 * 1024 * 1024) {
        showError('文件大小不能超过 2MB，请压缩图片后重试');
        return false;
    }

    return true;
}

function showPreview(file) {
    // 显示预览区域
    hideAllSections();
    if (previewSection) {
        previewSection.style.display = 'block';
    }
    
    // 设置图片预览
    const reader = new FileReader();
    reader.onload = function(e) {
        if (previewImage) {
            previewImage.src = e.target.result;
        }
    };
    reader.readAsDataURL(file);
    
    // 设置文件信息
    if (imageName) {
        imageName.textContent = file.name;
    }
    if (imageSize) {
        imageSize.textContent = formatFileSize(file.size);
    }
}

async function startRecognition() {
    if (!currentFile) {
        showError('请先选择图片文件');
        return;
    }

    try {
        // 显示加载状态
        showLoading();

        // 创建FormData
        const formData = new FormData();
        formData.append('image', currentFile);

        // 发送请求
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            // 显示结果
            showResult(result);
            showToast('图片识别完成！');
        } else {
            // 显示错误
            showError(result.error || '识别失败，请重试');
        }

    } catch (error) {
        console.error('识别错误:', error);
        showError(`识别失败: ${error.message}`);
    }
}

function showLoading() {
    hideAllSections();
    if (loadingSection) {
        loadingSection.style.display = 'block';
    }
    
    // 模拟进度条
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 90) progress = 90;
        
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }
        
        if (progress >= 90) {
            clearInterval(interval);
        }
    }, 500);
}

function showResult(result) {
    hideAllSections();
    if (resultSection) {
        resultSection.style.display = 'block';
    }
    
    // 设置OCR结果
    const ocrResult = result.ocrResult;
    if (ocrResult && resultText) {
        resultText.textContent = ocrResult.text || '未识别到文字内容';
    }
    
    // 设置元数据
    if (resultModel && ocrResult) {
        resultModel.textContent = ocrResult.model || 'Gemini 2.0 Flash';
    }
    if (resultConfidence && ocrResult && ocrResult.confidence) {
        resultConfidence.textContent = `${(ocrResult.confidence * 100).toFixed(1)}%`;
    }
    if (resultTokens && ocrResult && ocrResult.tokenCount) {
        resultTokens.textContent = ocrResult.tokenCount;
    }
}

function showError(message) {
    hideAllSections();
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    if (errorSection) {
        errorSection.style.display = 'block';
    }
}

function hideAllSections() {
    const sections = [previewSection, loadingSection, resultSection, errorSection];
    sections.forEach(section => {
        if (section) {
            section.style.display = 'none';
        }
    });
}

function resetToUpload() {
    hideAllSections();
    currentFile = null;
    if (fileInput) {
        fileInput.value = '';
    }
    
    // 重置进度条
    if (progressFill) {
        progressFill.style.width = '0%';
    }
}

function retryUpload() {
    if (currentFile) {
        startRecognition();
    } else {
        resetToUpload();
    }
}

async function copyTextToClipboard() {
    try {
        if (!resultText) return;
        
        const text = resultText.textContent;
        await navigator.clipboard.writeText(text);
        showToast('文本已复制到剪贴板');
    } catch (error) {
        console.error('复制失败:', error);
        // 降级方案
        try {
            const textArea = document.createElement('textarea');
            textArea.value = resultText.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('文本已复制到剪贴板');
        } catch (fallbackError) {
            showToast('复制失败，请手动选择文本复制');
        }
    }
}

function showToast(message) {
    // 创建简单的提示
    const toastEl = document.createElement('div');
    toastEl.textContent = message;
    toastEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(toastEl);
    
    setTimeout(() => {
        if (document.body.contains(toastEl)) {
            document.body.removeChild(toastEl);
        }
    }, 3000);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 