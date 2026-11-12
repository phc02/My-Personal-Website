// ================= 1. 行政区配置 =================
const targetDistricts = [
    { name: '汉南区', data1: 8, data2: 1 },   
    { name: '蔡甸区', data1: 14, data2: 1 },  
    { name: '洪山区', data1: 6, data2: 2 }    
];

// ================= 2. 坐标数据池 =================
const M7_COORDS = [114.052668, 30.239635];

const DISTRICT_SUPPLIER_COORDS = {
    '汉南区': {
        normal: [
            [114.064, 30.292], [114.065, 30.285], [114.075, 30.285],
            [114.078, 30.295], [114.080, 30.315], [114.075, 30.320],
            [114.065, 30.320], [114.055, 30.315]
        ],
        abnormal: [
            { pos: [114.070, 30.305], name: '四维国际座椅' }
        ]
    },
    '蔡甸区': {
        normal: [
            [114.055, 30.410], [114.060, 30.400], [114.065, 30.415],
            [114.070, 30.398], [114.075, 30.420], [114.080, 30.405],
            [114.085, 30.410], [114.060, 30.425], [114.068, 30.428],
            [114.072, 30.415], [114.050, 30.405], [114.058, 30.418],
            [114.078, 30.415], [114.082, 30.402]
        ], 
        abnormal: [
            { pos: [114.065, 30.405], name: '西虹实业' }
        ]
    },
   '洪山区': {
        normal: [
            [114.1545, 30.3400], [114.1550, 30.3390], [114.1585, 30.3355], 
            [114.1605, 30.3385], [114.1595, 30.3435], [114.1575, 30.3455]
        ],
        abnormal: [
            { pos: [114.1565, 30.3365], name: '东方金属' }, 
            { pos: [114.1615, 30.3415], name: '北路运输' } 
        ]
    }
};

// ================= 3. SVG 图像资源 =================
const ICONS = {
    m7Dot: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="%23FFBA00" stroke="white" stroke-width="1.5"/><circle cx="12" cy="12" r="10" fill="none" stroke="%231B33C4" stroke-width="2" stroke-opacity="0.9"/><circle cx="12" cy="12" r="12" fill="none" stroke="%234A6BFF" stroke-width="1" stroke-opacity="0.4"/></svg>',
    distDot: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="3" fill="%234FECF7" stroke="white" stroke-width="1"/><circle cx="6" cy="6" r="5" fill="none" stroke="%234FECF7" stroke-width="1" stroke-opacity="0.5"/></svg>',
    supDotNorm: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" fill="%2300FFCC" stroke="none"/></svg>',
    supDotAbnorm: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" fill="%23FF4400" stroke="none"/></svg>'
};

const TEMPLATES = {
  m7Content: `
        <div class="m7-label-text">小米M7工厂</div>
        
        <div class="m7-wave-wrapper">
            <div class="m7-giant-wave wave-stage1"></div>
            <div class="m7-giant-wave wave-stage2"></div>
            <div class="m7-giant-wave wave-stage3"></div>
        </div>

        <svg class="m7-svg-cone" viewBox="0 0 220 200" preserveAspectRatio="xMidYMid meet">
            <ellipse cx="110" cy="170" rx="100" ry="28" fill="none" stroke="#4A6BFF" stroke-width="1.5" opacity="0.3" />
            <ellipse cx="110" cy="170" rx="75" ry="20" fill="none" stroke="#4A6BFF" stroke-width="2.5" opacity="0.6" />
            <ellipse cx="110" cy="170" rx="45" ry="12" fill="#1B33C4" opacity="0.8" filter="url(#m7glow)" />
            <path d="M 106 30 C 106 100, 50 150, 25 170 C 65 185, 155 185, 195 170 C 170 150, 114 100, 114 30 Z" fill="url(#m7grad)" filter="url(#m7glow)" />
        </svg>
    `,
    getDistrictContent: (name, data1, data2) => `
        <div class="district-grow-wrap">
            <div class="marker-box">
                <div class="marker-title">${name}</div>
                <div class="marker-sub">${data1}家 | <span class="marker-highlight">${data2}家</span></div>
            </div>
            <div class="marker-line"></div>
        </div>
    `,
    getSupplierContent: (isAbnormal, name) => {
        let textLabel = '';
        if (isAbnormal && name) {
            textLabel = `
                <div class="sup-abnormal-label">
                    <div class="sup-abnormal-line1">${name}</div>
                    <div class="sup-abnormal-line2">设备故障, 停业</div>
                </div>
            `;
        }
        return `
            ${textLabel}
            <svg class="sup-svg-cone" viewBox="0 0 100 150" preserveAspectRatio="xMidYMid meet">
                <ellipse cx="50" cy="130" rx="30" ry="8" fill="none" stroke="${isAbnormal ? '#4400AA' : '#0044FF'}" stroke-width="2" opacity="0.5" />
                <path d="M 47 20 C 47 70, 30 115, 20 130 C 35 135, 65 135, 80 130 C 70 115, 53 70, 53 20 Z" fill="url(#${isAbnormal ? 'supAbnormGrad' : 'supNormGrad'})" filter="url(#m7glow)"/>
            </svg>
        `;
    }
};