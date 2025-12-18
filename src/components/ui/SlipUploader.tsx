'use client';

import { useState, useRef, DragEvent } from 'react';
import { Upload, Image, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { analyzeSlip, quickValidateSlip, fileToBase64 } from '@/lib/slip-verify';
import { SlipAnalysisResult } from '@/types';

interface SlipUploaderProps {
    onSlipAnalyzed: (imageUrl: string, result: SlipAnalysisResult) => void;
    expectedAmount?: number;
}

export function SlipUploader({ onSlipAnalyzed, expectedAmount }: SlipUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<SlipAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            await processFile(file);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await processFile(file);
        }
    };

    const processFile = async (file: File) => {
        setError(null);
        setAnalysisResult(null);

        // Quick validation
        const validation = quickValidateSlip(file);
        if (!validation.valid) {
            setError(validation.error || 'ไฟล์ไม่ถูกต้อง');
            return;
        }

        // Create preview
        const base64 = await fileToBase64(file);
        setPreview(base64);

        // Analyze slip
        setIsAnalyzing(true);
        try {
            const result = await analyzeSlip(file);
            setAnalysisResult(result);
            onSlipAnalyzed(base64, result);
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการวิเคราะห์สลิป');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const clearSlip = () => {
        setPreview(null);
        setAnalysisResult(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            {!preview ? (
                <div
                    className={`file-upload ${isDragging ? 'dragover' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload size={40} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 font-medium">ลากไฟล์มาวางที่นี่</p>
                    <p className="text-gray-400 text-sm mt-1">หรือคลิกเพื่อเลือกไฟล์</p>
                    <p className="text-gray-400 text-xs mt-2">รองรับ JPG, PNG, WebP (ขนาดไม่เกิน 10MB)</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>
            ) : (
                <div className="relative">
                    {/* Preview Image */}
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                        <img
                            src={preview}
                            alt="Slip preview"
                            className="w-full max-h-64 object-contain bg-gray-50"
                        />
                        <button
                            onClick={clearSlip}
                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Analysis Status */}
                    {isAnalyzing && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-xl flex items-center gap-3">
                            <Loader2 size={20} className="text-blue-600 animate-spin" />
                            <span className="text-blue-700">กำลังวิเคราะห์สลิป...</span>
                        </div>
                    )}

                    {/* Analysis Result */}
                    {analysisResult && (
                        <div className={`mt-4 p-4 rounded-xl ${analysisResult.isValid ? 'bg-green-50' : 'bg-yellow-50'
                            }`}>
                            <div className="flex items-start gap-3">
                                {analysisResult.isValid ? (
                                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                                ) : (
                                    <AlertCircle size={24} className="text-yellow-600 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                    <p className={`font-medium ${analysisResult.isValid ? 'text-green-700' : 'text-yellow-700'
                                        }`}>
                                        {analysisResult.isValid ? 'สลิปผ่านการตรวจสอบ' : 'ต้องตรวจสอบเพิ่มเติม'}
                                    </p>

                                    {/* Extracted Info */}
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                        {analysisResult.bankName && (
                                            <div>
                                                <span className="text-gray-500">ธนาคาร:</span>
                                                <span className="ml-2 font-medium">{analysisResult.bankName}</span>
                                            </div>
                                        )}
                                        {analysisResult.extractedAmount && (
                                            <div>
                                                <span className="text-gray-500">จำนวนเงิน:</span>
                                                <span className="ml-2 font-medium">
                                                    ฿{analysisResult.extractedAmount.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        {analysisResult.extractedDate && (
                                            <div>
                                                <span className="text-gray-500">วันที่:</span>
                                                <span className="ml-2 font-medium">{analysisResult.extractedDate}</span>
                                            </div>
                                        )}
                                        {analysisResult.extractedTime && (
                                            <div>
                                                <span className="text-gray-500">เวลา:</span>
                                                <span className="ml-2 font-medium">{analysisResult.extractedTime}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Confidence */}
                                    <div className="mt-3">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-500">ความมั่นใจ</span>
                                            <span className="font-medium">{analysisResult.confidence}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${analysisResult.confidence >= 70 ? 'bg-green-500' :
                                                        analysisResult.confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${analysisResult.confidence}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Issues */}
                                    {analysisResult.issues.length > 0 && (
                                        <div className="mt-3 text-sm">
                                            <p className="text-gray-600 font-medium mb-1">พบปัญหา:</p>
                                            <ul className="list-disc list-inside text-gray-500">
                                                {analysisResult.issues.map((issue, i) => (
                                                    <li key={i}>{issue}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
