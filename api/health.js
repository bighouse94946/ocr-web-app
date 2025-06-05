module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    res.json({
        status: 'healthy',
        service: 'OCR Web Application',
        version: '1.0',
        timestamp: new Date().toISOString(),
        environment: 'vercel',
        runtime: process.version
    });
}; 