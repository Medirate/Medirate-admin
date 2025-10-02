"use client";

import { FaArrowLeft, FaDatabase, FaUpload, FaDownload, FaSync, FaEdit, FaTrash, FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import AdminNavbar from "../../components/AdminNavbar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function StateDataUpdatePage() {
  const router = useRouter();
  const stateName = "Alabama"; 
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingRecord, setEditingRecord] = useState(null);
  const [tableType, setTableType] = useState('dev'); // 'dev' or 'prod'

  const states = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];

  const handleFileUpload = async () => {
    if (!uploadFile) return;
    
    setUploading(true);
    setUploadMessage('');
    setUploadProgress(0);
    setUploadStatus('Starting upload...');
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    
    try {
      // Start the upload
      const response = await fetch('/api/alabama/upload-csv', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success && result.uploadId) {
        // Poll for real progress updates
        const pollProgress = async () => {
          try {
            const progressResponse = await fetch(`/api/alabama/upload-progress?id=${result.uploadId}`);
            const progressData = await progressResponse.json();
            
            setUploadProgress(progressData.progress);
            setUploadStatus(progressData.message);
            
            if (progressData.status === 'completed') {
              setUploadMessage(`✅ Successfully uploaded ${result.recordCount} records to development table`);
              setUploadFile(null);
              setUploading(false);
              fetchData();
              return;
            } else if (progressData.status === 'error') {
              setUploadMessage(`❌ Error: ${progressData.message}`);
              setUploadStatus('Failed');
              setUploading(false);
              return;
            } else {
              // Continue polling
              setTimeout(pollProgress, 500);
            }
          } catch (error) {
            console.error('Progress polling error:', error);
            setUploadMessage(`❌ Failed to track progress`);
            setUploadStatus('Failed');
            setUploading(false);
          }
        };
        
        // Start polling for progress
        setTimeout(pollProgress, 100);
        
      } else {
        setUploadMessage(`❌ Error: ${result.error}`);
        setUploadStatus('Failed');
        setUploading(false);
      }
    } catch (error: any) {
      setUploadMessage(`❌ Upload failed: ${error.message || error}`);
      setUploadStatus('Failed');
      setUploading(false);
    }
  };

  const pushToProduction = async () => {
    setUploading(true);
    setUploadMessage('');
    setUploadProgress(0);
    setUploadStatus('Preparing production push...');
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);
    
    try {
      setUploadStatus('Copying data to production...');
      setUploadProgress(30);
      
      const response = await fetch('/api/alabama/push-to-production', {
        method: 'POST',
      });
      
      setUploadStatus('Finalizing production data...');
      setUploadProgress(70);
      
      const result = await response.json();
      
      setUploadStatus('Complete!');
      setUploadProgress(100);
      
      if (result.success) {
        setUploadMessage(`✅ Successfully pushed ${result.recordCount} records to production`);
        // Refresh data
        fetchData();
      } else {
        setUploadMessage(`❌ Error: ${result.error}`);
        setUploadStatus('Failed');
      }
    } catch (error) {
      setUploadMessage(`❌ Push to production failed: ${error}`);
      setUploadStatus('Failed');
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus('');
      }, 3000);
    }
  };

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/alabama/data?page=${page}&limit=50&table=${tableType}`);
      const result = await response.json();
      
      if (result.data) {
        setData(result.data);
        setCurrentPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableType]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminNavbar />

      <div className="flex">
        {/* Side Navigation */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-[#012C61] mb-6">Data Update</h2>
            <nav className="space-y-1 max-h-96 overflow-y-auto">
              <Link href="/data-update" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Home
              </Link>
              {states.map((state) => (
                <Link
                  key={state}
                  href={`/data-update/${state.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    stateName === state
                      ? "text-white bg-[#012C61]"
                      : "text-gray-700 hover:bg-blue-50 hover:text-[#012C61]"
                  }`}
                >
                  <FaDatabase className="mr-3" />
                  {state}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <Link href="/data-update" className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FaArrowLeft className="h-6 w-6 text-[#012C61]" />
            </Link>
            <FaDatabase className="h-8 w-8 text-[#012C61] mr-3" />
            <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase">
              {stateName} Data Update
            </h1>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'upload' ? 'bg-white text-[#012C61] shadow-sm' : 'text-gray-600'
                }`}
              >
                <FaUpload className="inline mr-2" />
                Upload CSV
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'data' ? 'bg-white text-[#012C61] shadow-sm' : 'text-gray-600'
                }`}
              >
                <FaEye className="inline mr-2" />
                View Data
              </button>
            </div>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload CSV File</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span className="font-medium">{uploadStatus}</span>
                    <span className="font-semibold">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4 mb-6">
                <button
                  onClick={handleFileUpload}
                  disabled={!uploadFile || uploading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {uploadStatus || 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <FaUpload className="mr-2" />
                      Upload to Development
                    </>
                  )}
                </button>

                <button
                  onClick={pushToProduction}
                  disabled={uploading}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaSync className="mr-2" />
                      Push to Production
                    </>
                  )}
                </button>
              </div>

              {uploadMessage && (
                <div className={`p-4 rounded-lg ${
                  uploadMessage.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {uploadMessage}
                </div>
              )}
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Data Management</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setTableType('dev')}
                    className={`px-3 py-1 rounded text-sm ${
                      tableType === 'dev' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Development
                  </button>
                  <button
                    onClick={() => setTableType('prod')}
                    className={`px-3 py-1 rounded text-sm ${
                      tableType === 'prod' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Production
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.map((record: any) => (
                        <tr key={record.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.service_code}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{record.service_description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.rate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.rate_effective_date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">
                              <FaEdit />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => fetchData(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => fetchData(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
