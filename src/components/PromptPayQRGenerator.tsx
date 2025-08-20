"use client"

import React, { useState, useRef } from 'react';
import { QrCode, Smartphone, DollarSign, ArrowLeft, User, AlertTriangle, Info, Download } from 'lucide-react';

const PromptPayQRGenerator = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [showResult, setShowResult] = useState(false);
  const qrCardRef = useRef<HTMLDivElement>(null);

  // ✨ ฟังก์ชันตรวจสอบค่าธรรมเนียม
  const checkTransactionFee = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return null;
    
    if (numAmount <= 5000) {
      return {
        hasWarning: false,
        message: 'การโอนฟรีค่าธรรมเนียม (ไม่เกิน 5,000 บาท)',
        color: 'green'
      };
    } else if (numAmount <= 30000) {
      return {
        hasWarning: true,
        message: 'การโอนเงินเกิน 5,000 บาท มีค่าธรรมเนียมไม่เกิน 2 บาท',
        color: 'yellow'
      };
    } else if (numAmount <= 100000) {
      return {
        hasWarning: true,
        message: 'การโอนเงินเกิน 30,000 บาท มีค่าธรรมเนียมไม่เกิน 5 บาท',
        color: 'orange'
      };
    } else {
      return {
        hasWarning: true,
        message: 'การโอนเงินเกิน 100,000 บาท มีค่าธรรมเนียมไม่เกิน 10 บาท',
        color: 'red'
      };
    }
  };

  // ✨ คำนวดค่าธรรมเนียมโดยประมาณ
  const calculateEstimatedFee = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 5000) return 0;
    
    if (numAmount <= 30000) return 2;
    if (numAmount <= 100000) return 5;
    return 10;
  };

  // ✨ จัดการเมื่อเปลี่ยนจำนวนเงิน
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
  };

  // ✨ สร้าง QR Code โดยใช้ PromptPay.io API
  const generateQR = async () => {
    if (!phoneNumber) {
      alert('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }
    
    // ตรวจสอบรูปแบบเบอร์โทรศัพท์
    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
    if (!/^[0-9]{10,13}$/.test(cleanPhone)) {
      alert('กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (10-13 หลัก)');
      return;
    }
    
    // ตรวจสอบจำนวนเงิน
    if (amount && (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)) {
      alert('กรุณากรอกจำนวนเงินที่ถูกต้อง');
      return;
    }

    // ✨ แสดงคำเตือนก่อนสร้าง QR สำหรับเงินเกิน 5000
    if (amount && parseFloat(amount) > 5000) {
      const estimatedFee = calculateEstimatedFee(amount);
      const confirmed = window.confirm(
        `คำเตือน: จำนวนเงิน ${parseFloat(amount).toLocaleString()} บาท เกินวงเงินฟรี\n\n` +
        `การโอนเงินเกิน 5,000 บาท จะมีค่าธรรมเนียมประมาณ ${estimatedFee} บาท\n` +
        '(ขึ้นอยู่กับธนาคารของผู้โอน)\n\n' +
        'คุณต้องการสร้าง QR Code ต่อไปหรือไม่?'
      );
      
      if (!confirmed) {
        return;
      }
    }
    
    try {
      // จัดรูปแบบเบอร์โทรศัพท์ให้ถูกต้อง
      let formattedPhone = cleanPhone;
      if (formattedPhone.startsWith('66')) {
        formattedPhone = '0' + formattedPhone.substring(2);
      } else if (!formattedPhone.startsWith('0')) {
        formattedPhone = '0' + formattedPhone;
      }
      
      // สร้าง URL สำหรับ PromptPay.io API
      let promptPayUrl = '';
      if (amount && parseFloat(amount) > 0) {
        promptPayUrl = `https://promptpay.io/${formattedPhone}/${parseFloat(amount)}`;
      } else {
        promptPayUrl = `https://promptpay.io/${formattedPhone}`;
      }
      
      setQrUrl(promptPayUrl);
      setShowResult(true);
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง QR Code: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // ✨ ฟังก์ชันสำหรับบันทึก QR Code เป็น PNG (ใช้ html2canvas)
  const saveQRAsImage = async () => {
    if (!qrCardRef.current) return;

    try {
      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;
      
      // สร้าง canvas จาก element
      const canvas = await html2canvas(qrCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // เพิ่มความละเอียด
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      // แปลงเป็น blob และดาวน์โหลด
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // ชื่อไฟล์
          const fileName = displayName 
            ? `promptpay-${displayName.replace(/\s+/g, '-')}-${phoneNumber}.png`
            : `promptpay-${phoneNumber}-${amount || 'custom'}.png`;
          
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('Error saving image:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกรูป กรุณาติดตั้ง html2canvas library');
    }
  };

  const goBack = () => {
    setShowResult(false);
  };

  // QR Result Page
  if (showResult && qrUrl) {
    const feeInfo = amount ? checkTransactionFee(amount) : null;
    const estimatedFee = amount ? calculateEstimatedFee(amount) : 0;

    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={goBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>กลับหน้าหลัก</span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-900">PromptPay QR Code</span>
              </div>
              <div className="w-20"></div>
            </div>
          </div>
        </div>

        {/* QR Card */}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
          <div 
            ref={qrCardRef}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Card Header */}
            <div className="bg-white border-b border-gray-100 px-8 py-6 text-center">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <QrCode className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">พร้อมเพย์</h1>
                  <p className="text-sm text-green-600 font-medium">PromptPay</p>
                </div>
              </div>
              <p className="text-gray-600 font-medium">เบอร์บัญชี: {phoneNumber}</p>
            </div>

            {/* Warning Banner สำหรับค่าธรรมเนียม */}
            {amount && feeInfo && feeInfo.hasWarning && (
              <div className={`px-8 py-4 ${
                feeInfo.color === 'red' ? 'bg-red-50 border-b border-red-200' :
                feeInfo.color === 'orange' ? 'bg-orange-50 border-b border-orange-200' :
                feeInfo.color === 'yellow' ? 'bg-yellow-50 border-b border-yellow-200' :
                'bg-green-50 border-b border-green-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                    feeInfo.color === 'red' ? 'text-red-500' :
                    feeInfo.color === 'orange' ? 'text-orange-500' :
                    feeInfo.color === 'yellow' ? 'text-yellow-500' :
                    'text-green-500'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      feeInfo.color === 'red' ? 'text-red-800' :
                      feeInfo.color === 'orange' ? 'text-orange-800' :
                      feeInfo.color === 'yellow' ? 'text-yellow-800' :
                      'text-green-800'
                    }`}>
                      {feeInfo.message}
                    </p>
                    {estimatedFee > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        ประมาณการค่าธรรมเนียม: {estimatedFee} บาท
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* QR Code Section */}
            <div className="px-8 py-8">
              <div className="bg-gray-50 rounded-2xl p-6 text-center mb-6">
                {/* ✨ ใช้ iframe แบบไม่มี scrollbar */}
                <iframe
                  src={qrUrl}
                  width="220"
                  height="220"
                  style={{ 
                    border: 'none', 
                    display: 'block', 
                    margin: '0 auto',
                    overflow: 'hidden'
                  }}
                  scrolling="no"
                  title="PromptPay QR Code"
                />
              </div>

              {/* Payment Details */}
              <div className="text-center space-y-2 mb-8">
                {displayName && (
                  <div>
                    <p className="text-sm text-gray-500">ชื่อบัญชี</p>
                    <p className="text-lg font-bold text-gray-900">{displayName}</p>
                  </div>
                )}
                {amount && (
                  <div>
                    <p className="text-sm text-gray-500">จำนวนเงิน</p>
                    <p className={`text-2xl font-bold ${
                      parseFloat(amount) > 5000 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {parseFloat(amount).toLocaleString()} บาท
                    </p>
                  </div>
                )}
                {!amount && (
                  <div>
                    <p className="text-sm text-gray-500">จำนวนเงิน</p>
                    <p className="text-lg font-medium text-gray-400">ผู้โอนกรอกเอง</p>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="text-center mt-6">
                <p className="text-xs text-gray-400">สแกน QR Code เพื่อโอนเงิน</p>
                <p className="text-xs text-gray-300 mt-1">ระบบ PromptPay ธนาคารแห่งประเทศไทย</p>
                <p className="text-xs text-green-500 mt-1 font-medium">ขับเคลื่อนโดย PromptPay.io API</p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
          <button
            onClick={saveQRAsImage}
            className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
          >
            <Download className="w-5 h-5" />
            <span>บันทึก PNG</span>
          </button>
          
          <button
            onClick={goBack}
            className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>สร้าง QR ใหม่</span>
          </button>
        </div>
      </div>
    );
  }

  // Main Form Page (เหมือนเดิม)
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PromptPay QR Generator</h1>
              <p className="text-sm text-gray-500">สร้าง QR Code รับเงินผ่าน PromptPay</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Input Form */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">ข้อมูลการรับเงิน</h2>
              
              <div className="space-y-6">
                {/* Display Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อที่แสดง
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="ชื่อร้าน/ผู้รับเงิน"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">ชื่อร้าน/บุคคลที่จะแสดงให้ลูกค้าเห็น (ไม่บังคับ)</p>
                </div>

                {/* Phone Number Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เบอร์โทรศัพท์ *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Smartphone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="xxx-xxx-xxxx"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">กรอกเบอร์โทรศัพท์ที่ลงทะเบียน PromptPay</p>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    จำนวนเงิน (บาท)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="ยอดเงิน"
                      min="0"
                      step="0.01"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">ปล่อยว่างไว้หากต้องการให้ลูกค้ากรอกเอง</p>
                  
                  {/* แสดงข้อมูลค่าธรรมเนียมแบบ Real-time */}
                  {amount && (
                    <div className="mt-3">
                      {(() => {
                        const feeInfo = checkTransactionFee(amount);
                        if (!feeInfo) return null;
                        
                        return (
                          <div className={`flex items-start space-x-2 p-3 rounded-lg ${
                            feeInfo.color === 'red' ? 'bg-red-50 border border-red-200' :
                            feeInfo.color === 'orange' ? 'bg-orange-50 border border-orange-200' :
                            feeInfo.color === 'yellow' ? 'bg-yellow-50 border border-yellow-200' :
                            'bg-green-50 border border-green-200'
                          }`}>
                            {feeInfo.color === 'red' ? (
                              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                            ) : feeInfo.color === 'orange' ? (
                              <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                            ) : feeInfo.color === 'yellow' ? (
                              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                            ) : (
                              <Info className="w-4 h-4 text-green-500 mt-0.5" />
                            )}
                            <div>
                              <p className={`text-sm font-medium ${
                                feeInfo.color === 'red' ? 'text-red-700' :
                                feeInfo.color === 'orange' ? 'text-orange-700' :
                                feeInfo.color === 'yellow' ? 'text-yellow-700' :
                                'text-green-700'
                              }`}>
                                {feeInfo.message}
                              </p>
                              {feeInfo.hasWarning && calculateEstimatedFee(amount) > 0 && (
                                <p className="text-xs text-gray-600 mt-1">
                                  ประมาณการค่าธรรมเนียม: {calculateEstimatedFee(amount)} บาท
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateQR}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[0.98] focus:ring-4 focus:ring-green-200"
                >
                  สร้าง QR Code
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <h3 className="font-semibold text-green-800 mb-3">วิธีการใช้งาน</h3>
              <div className="space-y-2 text-sm text-green-700">
                <p>• กรอกชื่อที่ต้องการแสดง (ไม่บังคับ)</p>
                <p>• กรอกเบอร์โทรศัพท์ที่ลงทะเบียน PromptPay</p>
                <p>• กรอกจำนวนเงิน (หรือปล่อยว่างให้ลูกค้ากรอกเอง)</p>
                <p>• กดปุ่ม &quot;สร้าง QR Code&quot; เพื่อสร้าง QR</p>
                <p>• นำ QR Code ที่ได้ไปให้ลูกค้าสแกน</p>
              </div>
            </div>

            {/* ข้อมูลค่าธรรมเนียมที่ถูกต้อง */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <span>ข้อมูลค่าธรรมเนียม PromptPay (มาตรการ)</span>
              </h3>
              <div className="space-y-2 text-sm text-blue-700">
                <p>• <span className="font-medium text-green-600">0 - 5,000 บาท:</span> ฟรีค่าธรรมเนียม</p>
                <p>• <span className="font-medium text-yellow-600">5,001 - 30,000 บาท:</span> ค่าธรรมเนียม ไม่เกิน 2 บาท</p>
                <p>• <span className="font-medium text-orange-600">30,001 - 100,000 บาท:</span> ค่าธรรมเนียม ไม่เกิน 5 บาท</p>
                <p>• <span className="font-medium text-red-600">100,001 บาท ขึ้นไป:</span> ค่าธรรมเนียม ไม่เกิน 10 บาท</p>
                <p className="text-xs mt-2 italic">*ค่าธรรมเนียมขึ้นอยู่กับธนาคารของผู้โอน แต่ละธนาคารอาจมีอัตราที่แตกต่างกัน</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">คำถามที่พบบ่อย</h2>
            <p className="text-gray-600">ข้อมูลทั้งหมดเกี่ยวกับ PromptPay และ QR Code</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3">พร้อมเพย์คืออะไร</h3>
                <p className="text-gray-700 leading-relaxed">
                  พร้อมเพย์คือบริการโอนเงินรูปแบบใหม่ ที่ใช้เพียงเบอร์โทรศัพท์มือถือผู้รับก็โอนได้ 
                  สามารถโอนข้ามธนาคารโดยไม่มีค่าธรรมเนียม
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3">มีค่าธรรมเนียมอย่างไร</h3>
                <p className="text-gray-700 leading-relaxed">
                  ฟรีค่าธรรมเนียมเมื่อโอนไม่เกิน 5,000 บาท และสามารถโอนได้ไม่จำกัดจำนวนครั้ง 
                  การโอนเงินเกินกว่า 5,000 บาท จะมีค่าธรรมเนียมเป็นขั้นบันได โดยเริ่มตั้งแต่ 2 บาทสำหรับยอด 5,001-30,000 บาท 
                  ค่าธรรมเนียมไม่แยกแยะว่าเป็นการโอนในเขต ข้ามเขต หรือต่างธนาคาร
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3">QR Code คืออะไร</h3>
                <p className="text-gray-700 leading-relaxed">
                  QR Code คือรหัสบาร์โค้ด 2 มิติ ซึ่งสามารถแสดงได้บนหน้าจอคอมพิวเตอร์หรือมือถือ 
                  และสามารถสแกนได้จากแอปของธนาคารต่างๆ อาทิ K PLUS, SCB EASY, หรือ KMA
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3">ธนาคารอะไรเข้าร่วมบ้าง</h3>
                <p className="text-gray-700 leading-relaxed">
                  ธนาคารพาณิชย์ทุกแห่งในประเทศไทย เช่น ธนาคารกสิกรไทย ธนาคารไทยพาณิชย์ 
                  ธนาคารกรุงไทย ธนาคารกรุงเทพ ธนาคารกรุงศรี
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center text-gray-500">
            <p className="text-sm">
              ขับเคลื่อนระบบโดย{' '}
              <a href="https://promptpay.io" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 font-medium">
                PromptPay.io API
              </a>{' '}
              | เว็บไซต์สร้างโดย{' '}
              <span className="text-green-600 font-medium">Tassy_420(สี่สองศูนย์)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptPayQRGenerator;
