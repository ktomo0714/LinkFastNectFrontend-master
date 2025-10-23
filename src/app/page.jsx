'use client';

import { useState } from 'react';

export default function POSPage() {
  const [productCode, setProductCode] = useState('');
  const [currentProduct, setCurrentProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // バックエンドAPIのURL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app-002-gen10-step3-1-py-oshima38.azurewebsites.net';

  // 商品コード読み込み
  const handleReadProduct = async () => {
    if (!productCode || productCode.length !== 13) {
      setMessage('13桁の商品コードを入力してください');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/code/${productCode}`);
      
      if (response.ok) {
        const product = await response.json();
        setCurrentProduct(product);
        setMessage('');
      } else {
        setMessage('商品が見つかりません');
        setCurrentProduct(null);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('商品の読み込みに失敗しました');
      setCurrentProduct(null);
    } finally {
      setLoading(false);
    }
  };

  // 購入リストに追加
  const handleAddToCart = () => {
    if (!currentProduct) {
      setMessage('商品を読み込んでください');
      return;
    }

    const existingIndex = cart.findIndex(item => item.prd_id === currentProduct.prd_id);
    
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { ...currentProduct, quantity: 1 }]);
    }

    setMessage('商品を追加しました');
    setCurrentProduct(null);
    setProductCode('');
  };

  // カートから削除
  const handleRemoveFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  // 合計金額計算
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // 購入処理
  const handlePurchase = async () => {
    if (cart.length === 0) {
      setMessage('カートが空です');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const expandedDetails = [];
      cart.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          expandedDetails.push({
            prd_id: item.prd_id,
            prd_code: item.code,
            prd_name: item.name,
            prd_price: item.price
          });
        }
      });

      const transactionData = {
        emp_cd: '9999999999',
        store_cd: '30',
        pos_no: '90',
        details: expandedDetails
      };

      const response = await fetch(`${API_BASE_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData)
      });

      if (response.ok) {
        const total = calculateTotal();
        const tax = Math.floor(total * 0.1);
        alert(`購入完了！\n小計: ${total}円\n消費税: ${tax}円\n合計: ${total + tax}円`);
        setCart([]);
        setMessage('購入が完了しました');
      } else {
        setMessage('購入処理に失敗しました');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('購入処理でエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">
          🛒 POSシステム
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* 左側: 商品読み込みエリア */}
          <div className="space-y-6">
            {/* コード入力エリア */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                ②コード入力エリア
              </h2>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleReadProduct()}
                  placeholder="13桁の商品コード"
                  maxLength={13}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  disabled={loading}
                />
                
                <button
                  onClick={handleReadProduct}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition disabled:bg-gray-400"
                >
                  {loading ? '読み込み中...' : '①読み込みボタン'}
                </button>
              </div>

              {message && (
                <div className={`mt-4 p-3 rounded text-sm ${
                  message.includes('失敗') || message.includes('見つかりません') || message.includes('空') 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {message}
                </div>
              )}
            </div>

            {/* 商品表示エリア */}
            {currentProduct && (
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                  ③名称表示エリア / ④単価表示エリア
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">商品名:</span>
                    <span className="font-semibold">{currentProduct.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">商品コード:</span>
                    <span className="font-mono text-sm">{currentProduct.code}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">単価:</span>
                    <span className="text-xl sm:text-2xl font-bold text-blue-600">
                      {currentProduct.price}円
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={loading}
                  className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition disabled:bg-gray-400"
                >
                  ⑤追加
                </button>
              </div>
            )}
          </div>

          {/* 右側: 購入リストエリア */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
              ⑥購入品目リスト
            </h2>

            {cart.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <div className="text-6xl mb-4">🛒</div>
                <p>商品が追加されていません</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{item.name}</div>
                        <div className="text-sm text-gray-600">
                          {item.price}円 × {item.quantity}個
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 ml-2">
                        <div className="text-base sm:text-lg font-bold text-blue-600 whitespace-nowrap">
                          {item.price * item.quantity}円
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(index)}
                          className="text-red-500 hover:text-red-700 transition p-1"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 pt-4 space-y-2">
                  <div className="flex justify-between text-base sm:text-lg">
                    <span>小計:</span>
                    <span className="font-semibold">{calculateTotal()}円</span>
                  </div>
                  <div className="flex justify-between text-base sm:text-lg">
                    <span>消費税 (10%):</span>
                    <span className="font-semibold">{Math.floor(calculateTotal() * 0.1)}円</span>
                  </div>
                  <div className="flex justify-between text-xl sm:text-2xl font-bold text-blue-600 pt-2 border-t">
                    <span>合計:</span>
                    <span>{calculateTotal() + Math.floor(calculateTotal() * 0.1)}円</span>
                  </div>
                </div>

                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-lg transition disabled:bg-gray-400 text-base sm:text-lg"
                >
                  {loading ? '処理中...' : '⑦購入'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}