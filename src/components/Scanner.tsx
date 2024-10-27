import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

const Scanner: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setFile(files[0]);
        }
    };

    const preprocessImage = (file: File): Promise<HTMLImageElement> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                canvas.width = img.width;
                canvas.height = img.height;

                // Convert to grayscale
                ctx.drawImage(img, 0, 0);
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg; // Red
                    data[i + 1] = avg; // Green
                    data[i + 2] = avg; // Blue
                }

                ctx.putImageData(imgData, 0, 0);
                const processedImg = new Image();
                processedImg.src = canvas.toDataURL();
                processedImg.onload = () => resolve(processedImg);
            };
        });
    };

    const handleScan = async () => {
        if (file) {
            setLoading(true);
            const preprocessedImage = await preprocessImage(file);

            Tesseract.recognize(
                preprocessedImage.src,
                'eng',
                {
                    logger: (info) => console.log(info),
                }
            ).then(({ data: { text } }) => {
                setText(text);
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    };

    return (
        <div>
            <h1>Document Scanner</h1>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            <button onClick={handleScan} disabled={loading || !file}>
                {loading ? 'Scanning...' : 'Scan Document'}
            </button>
            {text && <div><h2>Scanned Text:</h2><p>{text}</p></div>}
        </div>
    );
};

export default Scanner;
