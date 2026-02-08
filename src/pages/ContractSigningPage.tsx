import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { useToast } from '../components/Toast';
import SignatureCanvas from '../components/SignatureCanvas';
import * as api from '../services/api';
import { formatDate } from '../utils/formatDate';

export default function ContractSigningPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [contractData, setContractData] = useState<{
    link: any;
    contract: api.Contract;
    candidate: any;
    html: string;
  } | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!token) {
      setError('Invalid signing link');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8080'}/api/v1/public/contracts/sign/${token}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 404) {
            setError('Signing link not found');
          } else if (res.status === 410) {
            setError(data?.error?.message || 'This signing link has expired or has already been used');
          } else {
            setError(data?.error?.message || 'Failed to load contract');
          }
          return;
        }
        setContractData(data);
      } catch (e) {
        setError('Failed to load contract');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const handleSign = async () => {
    if (!token) return;
    if (!signatureData) {
      toast.error('Please draw your signature before signing');
      return;
    }
    setSigning(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8080'}/api/v1/public/contracts/sign/${token}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature_data: signatureData,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to sign contract');
      }
      toast.success('Contract signed successfully!');
      // Reload to show signed state
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sign contract');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardBody>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Contract</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => navigate('/')}>Go to Home</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!contractData) {
    return null;
  }

  const isSigned = contractData.link.signed_at != null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Contract Signing</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {isSigned 
                    ? 'This contract has been signed. Review the details below.'
                    : 'Please carefully review the contract below. By signing, you agree to all terms and conditions.'}
                </p>
              </div>
              {contractData.candidate && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Candidate</p>
                  <p className="font-bold text-gray-900">{contractData.candidate.full_name}</p>
                  {contractData.contract.contract_number && (
                    <p className="text-xs text-gray-500 mt-1">Contract #{contractData.contract.contract_number}</p>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {/* Contract Content */}
            <div className="mb-8">
              <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-8 md:p-12 overflow-y-auto" style={{ maxHeight: '70vh' }}>
                  {contractData.html && contractData.html.trim() !== '' && !contractData.html.includes('Contract document is available') && !contractData.html.includes('Contract content is being prepared') ? (
                    <div 
                      className="contract-content"
                      style={{ 
                        fontFamily: 'Times New Roman, serif',
                        fontSize: '12pt',
                        lineHeight: '1.6',
                        color: '#000'
                      }}
                      dangerouslySetInnerHTML={{ __html: contractData.html }} 
                    />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg font-semibold mb-2">Contract content is not available.</p>
                      <p className="text-sm">Please contact HR for assistance.</p>
                      {contractData.html && (
                        <div className="mt-4 text-xs text-gray-400 italic">
                          Debug: HTML length = {contractData.html.length}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Signature Section */}
            {!isSigned && (
              <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Signature Section</h3>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <p className="text-sm font-bold text-gray-700 mb-2">Company Representative</p>
                    <div className="border-b-2 border-gray-400 pb-2 mb-2 min-h-[150px] flex items-end justify-center">
                      <p className="text-sm text-gray-500 italic">Company signature will be added here</p>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 text-center">Company Name</p>
                  </div>
                  <div className="bg-white p-4 rounded border-2 border-blue-300">
                    <p className="text-sm font-bold text-blue-700 mb-2">Your Signature</p>
                    {contractData.candidate && (
                      <>
                        <div className="flex flex-col items-center">
                          <SignatureCanvas
                            onSignatureChange={setSignatureData}
                            width={350}
                            height={120}
                            disabled={false}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-2 text-center">{contractData.candidate.full_name}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Please draw your signature above, then click "Sign Contract" below. By signing, you acknowledge that you have read, understood, and agree to all terms and conditions stated in this contract.
                  </p>
                </div>
              </div>
            )}

            {/* Show signature if already signed */}
            {isSigned && contractData.link.signature_data && (
              <div className="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Signature Section</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <p className="text-sm font-bold text-gray-700 mb-2">Company Representative</p>
                    <div className="border-b-2 border-gray-400 pb-2 mb-2 min-h-[150px] flex items-end justify-center">
                      <p className="text-sm text-gray-500 italic">Company signature</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded border-2 border-green-300">
                    <p className="text-sm font-bold text-green-700 mb-2">Your Signature</p>
                    <div className="flex justify-center">
                      <img 
                        src={contractData.link.signature_data} 
                        alt="Signature" 
                        className="max-w-full h-auto border-b-2 border-green-500 pb-2"
                        style={{ maxHeight: '120px' }}
                      />
                    </div>
                    {contractData.candidate && (
                      <p className="text-xs text-gray-600 mt-2 text-center">{contractData.candidate.full_name}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6 border-t border-gray-200">
              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  onClick={() => window.print()}
                  className="!px-4 !py-2"
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print / Save PDF
                </Button>
              </div>
              {!isSigned ? (
                <Button
                  onClick={handleSign}
                  disabled={signing || !signatureData}
                  className="!px-6 !py-3 !text-base font-bold"
                >
                  {signing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      {signatureData ? 'Sign Contract' : 'Draw Signature First'}
                    </>
                  )}
                </Button>
              ) : (
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-green-800">Contract Signed</p>
                      <p className="text-xs text-green-600">
                        Signed on {new Date(contractData.link.signed_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Info */}
            {contractData.contract.created_at && (
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                  Contract created on {formatDate(contractData.contract.created_at)}
                  {contractData.contract.sent_at && (
                    <> • Sent for signature on {formatDate(contractData.contract.sent_at)}</>
                  )}
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
