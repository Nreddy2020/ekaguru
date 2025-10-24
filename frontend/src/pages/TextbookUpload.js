import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '@/App';
import axios from 'axios';
import { ArrowLeft, Upload, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const TextbookUpload = () => {
  const navigate = useNavigate();
  const { textbooks, setTextbooks, API, fetchInitialData } = useContext(AppContext);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.txt')) {
        toast.error('Please upload a .txt file');
        return;
      }
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace('.txt', ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (!title || !subject) {
      toast.error('Please fill in title and subject');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('subject', subject);

      setUploadProgress(30);

      const response = await axios.post(`${API}/textbooks/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 50) / progressEvent.total) + 30;
          setUploadProgress(progress);
        },
      });

      setUploadProgress(100);
      toast.success(`Textbook "${title}" uploaded successfully!`);
      
      // Add to textbooks list
      setTextbooks([...textbooks, response.data]);
      
      // Reset form
      setFile(null);
      setTitle('');
      setSubject('');
      setUploadProgress(0);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload textbook. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mb-4"
            data-testid="back-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="text-center">
            <Upload className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Textbook</h1>
            <p className="text-gray-600">
              Add new learning materials for your virtual tutor
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Form */}
          <Card data-testid="upload-form-card">
            <CardHeader>
              <CardTitle>Upload New Textbook</CardTitle>
              <CardDescription>
                Currently supports .txt files. PDF and EPUB support coming soon!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".txt"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="cursor-pointer"
                  data-testid="file-input"
                />
                {file && (
                  <p className="text-sm text-gray-600 mt-2" data-testid="selected-file">
                    Selected: {file.name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="title">Textbook Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Biology"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={uploading}
                  data-testid="title-input"
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Biology, Mathematics, History"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={uploading}
                  data-testid="subject-input"
                />
              </div>

              {uploading && (
                <div data-testid="upload-progress">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Processing...</span>
                    <span className="text-sm font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {uploadProgress < 30 && 'Uploading file...'}
                    {uploadProgress >= 30 && uploadProgress < 80 && 'Creating embeddings...'}
                    {uploadProgress >= 80 && 'Finalizing...'}
                  </p>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                data-testid="upload-btn"
              >
                {uploading ? 'Processing...' : 'Upload Textbook'}
              </Button>
            </CardContent>
          </Card>

          {/* Instructions & Uploaded List */}
          <div className="space-y-6">
            <Card data-testid="instructions-card">
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-medium">
                      1
                    </span>
                    <span>Select a .txt file containing your textbook content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-medium">
                      2
                    </span>
                    <span>Enter a title and subject for easy identification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-medium">
                      3
                    </span>
                    <span>Our AI will process the content and create embeddings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-medium">
                      4
                    </span>
                    <span>Start learning! Your tutor can now teach from this textbook</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card data-testid="uploaded-list-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Uploaded Textbooks
                </CardTitle>
                <CardDescription>{textbooks.length} textbooks available</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {textbooks.map((tb) => (
                    <div
                      key={tb.id}
                      className="p-3 bg-gray-50 rounded-lg flex items-start gap-3"
                      data-testid={`uploaded-textbook-${tb.id}`}
                    >
                      <FileText className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{tb.title}</p>
                        <p className="text-xs text-gray-500">{tb.subject}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {tb.total_chunks} chunks processed
                        </p>
                      </div>
                    </div>
                  ))}
                  {textbooks.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4" data-testid="no-textbooks">
                      No textbooks uploaded yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextbookUpload;