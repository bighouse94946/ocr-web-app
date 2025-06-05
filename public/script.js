// DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const processingSection = document.getElementById('processingSection');
const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');
const previewImage = document.getElementById('previewImage');
const imageName = document.getElementById('imageName');
const textContent = document.getElementById('textContent');
const resultMeta = document.getElementById('resultMeta');
const copyBtn = document.getElementById('copyBtn');
const newUploadBtn = document.getElementById('newUploadBtn');
const retryBtn = document.getElementById('retryBtn');
const errorMessage = document.getElementById('errorMessage');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

let currentFile = null;

// 初始化事件监听器
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

function initializeEventListeners() {
    // 上传按钮点击事件
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 上传区域点击事件
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择事件
    fileInput.addEventListener('change', handleFileSelect);

    // 拖拽事件
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // 按钮事件
    copyBtn.addEventListener('click', copyTextToClipboard);
    newUploadBtn.addEventListener('click', resetToUpload);
    retryBtn.addEventListener('click', retryUpload);

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
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (validateFile(file)) {
            currentFile = file;
            uploadFile(file);
        }
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
        currentFile = file;
        uploadFile(file);
    }
}

function validateFile(file) {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
        showError('请选择图片文件（JPG、PNG、GIF等格式）');
        return false;
    }

    // 检查文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
        showError('文件大小不能超过 10MB');
        return false;
    }

    return true;
}

async function uploadFile(file) {
    try {
        // 显示处理状态
        showProcessing();

        // 创建FormData
        const formData = new FormData();
        formData.append('image', file);

        // 发送请求
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // 显示结果
            showResult(result);
            showToast('图片识别完成！', 'success');
        } else {
            // 显示错误
            showError(result.error || '上传失败，请重试');
        }

    } catch (error) {
        console.error('上传错误:', error);
        showError('网络错误，请检查连接后重试');
    }
}

function showProcessing() {
    hideAllSections();
    processingSection.style.display = 'block';
}

function showResult(result) {
    hideAllSections();
    
    // 设置图片预览
    previewImage.src = result.imageUrl;
    imageName.textContent = result.originalName;
    
    // 设置OCR结果
    const ocrResult = result.ocrResult;
    if (ocrResult.success !== false) {
        textContent.textContent = ocrResult.text || '未识别到文字内容';
        
        // 设置元数据
        let metaInfo = '';
        if (ocrResult.confidence) {
            metaInfo += `识别置信度: ${(ocrResult.confidence * 100).toFixed(1)}%`;
        }
        if (ocrResult.language) {
            metaInfo += metaInfo ? ` | 语言: ${ocrResult.language}` : `语言: ${ocrResult.language}`;
        }
        if (metaInfo) {
            resultMeta.textContent = metaInfo;
            resultMeta.style.display = 'block';
        } else {
            resultMeta.style.display = 'none';
        }
    } else {
        textContent.textContent = ocrResult.error || '识别失败';
        resultMeta.style.display = 'none';
    }
    
    resultSection.style.display = 'block';
}

function showError(message) {
    hideAllSections();
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
}

function hideAllSections() {
    processingSection.style.display = 'none';
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';
}

function resetToUpload() {
    hideAllSections();
    currentFile = null;
    fileInput.value = '';
    // 上传区域默认是显示的，不需要特别设置
}

function retryUpload() {
    if (currentFile) {
        uploadFile(currentFile);
    } else {
        resetToUpload();
    }
}

async function copyTextToClipboard() {
    try {
        const text = textContent.textContent;
        await navigator.clipboard.writeText(text);
        showToast('文本已复制到剪贴板', 'success');
    } catch (error) {
        console.error('复制失败:', error);
        // 降级方案
        try {
            const textArea = document.createElement('textarea');
            textArea.value = textContent.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('文本已复制到剪贴板', 'success');
        } catch (fallbackError) {
            showToast('复制失败，请手动选择文本复制', 'error');
        }
    }
}

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = 'toast show';
    
    // 根据类型设置颜色
    if (type === 'error') {
        toast.style.background = '#f56565';
    } else {
        toast.style.background = '#48bb78';
    }
    
    // 3秒后隐藏
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 图片预览功能
function previewImageFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 键盘快捷键支持
document.addEventListener('keydown', function(e) {
    // Ctrl+V 粘贴图片
    if (e.ctrlKey && e.key === 'v') {
        navigator.clipboard.read().then(items => {
            for (let item of items) {
                if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                    item.getType('image/png').then(blob => {
                        const file = new File([blob], 'pasted-image.png', { type: 'image/png' });
                        if (validateFile(file)) {
                            currentFile = file;
                            uploadFile(file);
                        }
                    });
                    break;
                }
            }
        }).catch(err => {
            console.log('剪贴板访问失败:', err);
        });
    }
    
    // ESC 键重置
    if (e.key === 'Escape') {
        resetToUpload();
    }
});

// 页面加载完成后的初始化
window.addEventListener('load', function() {
    console.log('OCR Web应用已加载完成');
    
    // 检查浏览器兼容性
    if (!window.FileReader) {
        showError('您的浏览器不支持文件上传功能，请升级浏览器');
        return;
    }
    
    if (!window.fetch) {
        showError('您的浏览器不支持现代网络功能，请升级浏览器');
        return;
    }
});

class OCRApp {
    constructor() {
        this.currentFile = null;
        this.currentZoom = 1;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.imageStart = { x: 0, y: 0 };
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupDragAndDrop();
        this.setupImagePreviewModal();
    }

    bindEvents() {
        // 文件选择
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // 按钮事件
        const recognizeBtn = document.getElementById('recognizeBtn');
        const resetBtn = document.getElementById('resetBtn');
        const copyBtn = document.getElementById('copyBtn');
        const newRecognitionBtn = document.getElementById('newRecognitionBtn');
        const retryBtn = document.getElementById('retryBtn');

        recognizeBtn?.addEventListener('click', () => this.startRecognition());
        resetBtn?.addEventListener('click', () => this.resetApp());
        copyBtn?.addEventListener('click', () => this.copyResult());
        newRecognitionBtn?.addEventListener('click', () => this.resetApp());
        retryBtn?.addEventListener('click', () => this.startRecognition());

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeImagePreview();
                this.resetApp();
            }
            if (e.ctrlKey && e.key === 'v') {
                this.handlePaste(e);
            }
        });
    }

    setupImagePreviewModal() {
        // 弹窗控制按钮
        const closeModalBtn = document.getElementById('closeModalBtn');
        const modalOverlay = document.getElementById('modalOverlay');
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const resetZoomBtn = document.getElementById('resetZoomBtn');

        closeModalBtn?.addEventListener('click', () => this.closeImagePreview());
        modalOverlay?.addEventListener('click', () => this.closeImagePreview());
        zoomInBtn?.addEventListener('click', () => this.zoomIn());
        zoomOutBtn?.addEventListener('click', () => this.zoomOut());
        resetZoomBtn?.addEventListener('click', () => this.resetZoom());

        // 图片拖拽功能
        this.setupImageDrag();
        
        // 鼠标滚轮缩放
        const imageContainer = document.getElementById('imageContainer');
        imageContainer?.addEventListener('wheel', (e) => this.handleWheel(e));
    }

    setupImageDrag() {
        const imageContainer = document.getElementById('imageContainer');
        const previewModalImage = document.getElementById('previewModalImage');

        if (!imageContainer || !previewModalImage) return;

        imageContainer.addEventListener('mousedown', (e) => {
            if (this.currentZoom > 1) {
                this.isDragging = true;
                this.dragStart.x = e.clientX;
                this.dragStart.y = e.clientY;
                
                const transform = previewModalImage.style.transform;
                const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
                if (match) {
                    this.imageStart.x = parseFloat(match[1]) || 0;
                    this.imageStart.y = parseFloat(match[2]) || 0;
                } else {
                    this.imageStart.x = 0;
                    this.imageStart.y = 0;
                }
                
                imageContainer.classList.add('dragging');
                e.preventDefault();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging && this.currentZoom > 1) {
                const deltaX = e.clientX - this.dragStart.x;
                const deltaY = e.clientY - this.dragStart.y;
                
                const newX = this.imageStart.x + deltaX;
                const newY = this.imageStart.y + deltaY;
                
                previewModalImage.style.transform = `scale(${this.currentZoom}) translate(${newX}px, ${newY}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                imageContainer.classList.remove('dragging');
            }
        });
    }

    handleWheel(e) {
        e.preventDefault();
        if (e.deltaY < 0) {
            this.zoomIn();
        } else {
            this.zoomOut();
        }
    }

    zoomIn() {
        if (this.currentZoom < 3) {
            this.currentZoom += 0.2;
            this.updateImageZoom();
        }
    }

    zoomOut() {
        if (this.currentZoom > 0.5) {
            this.currentZoom -= 0.2;
            this.updateImageZoom();
        }
    }

    resetZoom() {
        this.currentZoom = 1;
        this.updateImageZoom();
    }

    updateImageZoom() {
        const previewModalImage = document.getElementById('previewModalImage');
        const zoomLevel = document.getElementById('zoomLevel');
        
        if (previewModalImage) {
            previewModalImage.style.transform = `scale(${this.currentZoom})`;
        }
        
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.currentZoom * 100)}%`;
        }
    }

    openImagePreview(imageSrc, fileName, fileSize) {
        const modal = document.getElementById('imagePreviewModal');
        const previewModalImage = document.getElementById('previewModalImage');
        const modalImageName = document.getElementById('modalImageName');
        const modalImageSize = document.getElementById('modalImageSize');
        const modalImageDimensions = document.getElementById('modalImageDimensions');

        if (!modal || !previewModalImage) return;

        // 设置图片
        previewModalImage.src = imageSrc;
        previewModalImage.onload = () => {
            const img = previewModalImage;
            modalImageDimensions.textContent = `${img.naturalWidth} × ${img.naturalHeight}px`;
        };

        // 设置文件信息
        modalImageName.textContent = fileName || '未知文件';
        modalImageSize.textContent = fileSize || '未知大小';

        // 重置缩放
        this.currentZoom = 1;
        this.updateImageZoom();

        // 显示弹窗
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeImagePreview() {
        const modal = document.getElementById('imagePreviewModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => uploadArea.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('dragover'), false);
        });

        uploadArea.addEventListener('drop', (e) => this.handleDrop(e), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    this.processFile(file);
                }
                break;
            }
        }
    }

    processFile(file) {
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            this.showError('请选择图片文件！');
            return;
        }

        // 验证文件大小 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showError('文件大小不能超过 10MB！');
            return;
        }

        this.currentFile = file;
        this.showPreview(file);
    }

    showPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // 显示预览图片
            const previewImage = document.getElementById('previewImage');
            previewImage.src = e.target.result;

            // 添加点击事件打开大图预览
            previewImage.onclick = () => {
                this.openImagePreview(e.target.result, file.name, this.formatFileSize(file.size));
            };

            // 显示文件信息
            const imageName = document.getElementById('imageName');
            const imageSize = document.getElementById('imageSize');
            imageName.textContent = file.name;
            imageSize.textContent = this.formatFileSize(file.size);

            // 切换到预览界面
            this.showSection('previewSection');
        };
        reader.readAsDataURL(file);
    }

    async startRecognition() {
        if (!this.currentFile) {
            this.showError('请先选择图片文件！');
            return;
        }

        // 显示加载界面
        this.showSection('loadingSection');
        this.updateLoadingProgress(0);

        try {
            // 创建FormData
            const formData = new FormData();
            formData.append('image', this.currentFile);

            // 模拟进度更新
            const progressInterval = setInterval(() => {
                const progressFill = document.getElementById('progressFill');
                const currentWidth = parseInt(progressFill.style.width) || 0;
                if (currentWidth < 90) {
                    this.updateLoadingProgress(currentWidth + 10);
                }
            }, 500);

            // 发送请求
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);
            this.updateLoadingProgress(100);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.showResult(result);
            } else {
                throw new Error(result.error || '识别失败');
            }

        } catch (error) {
            console.error('识别失败:', error);
            this.showError(`识别失败: ${error.message}`);
        }
    }

    showResult(result) {
        const { ocrResult } = result;
        
        // 更新结果信息
        document.getElementById('resultModel').textContent = ocrResult.model || 'Google Gemini 2.0 Flash';
        document.getElementById('resultConfidence').textContent = 
            ocrResult.confidence ? `${(ocrResult.confidence * 100).toFixed(1)}%` : '未知';
        document.getElementById('resultTokens').textContent = ocrResult.tokenCount || '未知';
        
        // 显示识别文本
        const resultText = document.getElementById('resultText');
        resultText.textContent = ocrResult.text || '未能识别到文本内容';
        
        // 切换到结果界面
        this.showSection('resultSection');
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        this.showSection('errorSection');
    }

    showSection(sectionId) {
        // 隐藏所有区域
        const sections = [
            'uploadSection', 'previewSection', 'loadingSection', 
            'resultSection', 'errorSection'
        ];
        
        sections.forEach(id => {
            const element = document.getElementById(id.replace('Section', 'Section'));
            if (element) {
                element.style.display = 'none';
            }
        });

        // 特殊处理section名称映射
        const sectionMap = {
            'uploadSection': 'upload-section',
            'previewSection': 'preview-section', 
            'loadingSection': 'loading-section',
            'resultSection': 'result-section',
            'errorSection': 'error-section'
        };

        // 显示指定区域
        const targetId = sectionMap[sectionId] || sectionId;
        const targetElement = document.querySelector(`.${targetId}`) || document.getElementById(sectionId);
        if (targetElement) {
            targetElement.style.display = 'block';
        }
    }

    updateLoadingProgress(percentage) {
        const progressFill = document.getElementById('progressFill');
        const loadingText = document.getElementById('loadingText');
        
        progressFill.style.width = `${percentage}%`;
        
        if (percentage < 30) {
            loadingText.textContent = '正在上传图片...';
        } else if (percentage < 60) {
            loadingText.textContent = '正在调用AI模型...';
        } else if (percentage < 90) {
            loadingText.textContent = '正在识别文字内容...';
        } else {
            loadingText.textContent = '即将完成...';
        }
    }

    async copyResult() {
        const resultText = document.getElementById('resultText').textContent;
        
        try {
            await navigator.clipboard.writeText(resultText);
            this.showToast('文本已复制到剪贴板！');
        } catch (error) {
            // 回退方法
            const textArea = document.createElement('textarea');
            textArea.value = resultText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('文本已复制到剪贴板！');
        }
    }

    resetApp() {
        this.currentFile = null;
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
        
        this.showSection('uploadSection');
    }

    showToast(message) {
        // 创建临时提示
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                document.body.removeChild(toast);
                document.head.removeChild(style);
            }, 300);
        }, 2000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new OCRApp();
}); 