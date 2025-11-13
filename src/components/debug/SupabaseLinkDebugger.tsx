import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  extractAuthParams, 
  hasValidAuthParams, 
  logAuthDebug, 
  createManualRedirectUrl 
} from '@/utils/supabaseRedirectHandler';
import { parseSupabaseLink, createManualRedirectUrl as createRedirectUrl } from '@/utils/linkInterceptor';

interface SupabaseLinkDebuggerProps {
  onClose?: () => void;
}

export default function SupabaseLinkDebugger({ onClose }: SupabaseLinkDebuggerProps) {
  const [supabaseLink, setSupabaseLink] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showTokens, setShowTokens] = useState(false);

  const analyzeLink = () => {
    if (!supabaseLink.trim()) {
      setAnalysis({ error: 'Por favor, cole o link do Supabase primeiro' });
      setShowResults(true);
      return;
    }

    try {
      // Usar o parser do linkInterceptor
      const parsedLink = parseSupabaseLink(supabaseLink);
      
      if (parsedLink) {
        const result = {
          isValid: true,
          token: parsedLink.token,
          type: parsedLink.type,
          redirectTo: parsedLink.redirectTo,
          originalUrl: parsedLink.originalUrl,
          expectedRedirectUrl: createRedirectUrl(parsedLink),
          parsedLink: parsedLink
        };

        setAnalysis(result);
        setShowResults(true);
      } else {
        setAnalysis({ 
          error: 'Link do Supabase inválido ou malformado' 
        });
        setShowResults(true);
      }
    } catch (error) {
      setAnalysis({ 
        error: `Erro ao analisar link: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
      setShowResults(true);
    }
  };

  const testCurrentURL = () => {
    logAuthDebug();
    const params = extractAuthParams();
    const hasValid = hasValidAuthParams();
    
    setAnalysis({
      currentUrl: window.location.href,
      hasValidParams: hasValid,
      extractedParams: params,
      message: hasValid ? 'URL atual contém parâmetros válidos!' : 'URL atual não contém parâmetros válidos'
    });
    setShowResults(true);
  };

  const simulateRedirect = () => {
    if (analysis?.expectedRedirectUrl) {
      if (confirm('Deseja navegar para a URL simulada?')) {
        window.location.href = analysis.expectedRedirectUrl;
      }
    }
  };

  const processLink = () => {
    if (analysis?.parsedLink) {
      if (confirm('Deseja processar este link do Supabase?')) {
        const redirectUrl = createRedirectUrl(analysis.parsedLink);
        console.log('🔄 Processando link e redirecionando para:', redirectUrl);
        window.location.href = redirectUrl;
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Debug Supabase Link
          <Badge variant="outline">Debug</Badge>
        </CardTitle>
        <CardDescription>
          Ferramenta para analisar e debugar links de recuperação de senha do Supabase
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Input do Link */}
        <div className="space-y-2">
          <Label htmlFor="supabase-link">Link do Supabase para analisar:</Label>
          <div className="flex gap-2">
            <Input
              id="supabase-link"
              value={supabaseLink}
              onChange={(e) => setSupabaseLink(e.target.value)}
              placeholder="Cole o link do email aqui..."
              className="flex-1"
            />
            <Button onClick={analyzeLink} disabled={!supabaseLink.trim()}>
              Analisar
            </Button>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={testCurrentURL} variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Analisar URL Atual
          </Button>
          <Button onClick={() => logAuthDebug()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Log Debug
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="ghost">
              Fechar
            </Button>
          )}
        </div>

        {/* Resultados */}
        {showResults && analysis && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Resultados da Análise</h3>
              {analysis.error ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : analysis.isValid ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
            </div>

            {analysis.error ? (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{analysis.error}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {/* Status */}
                <Alert variant={analysis.isValid ? "default" : "destructive"}>
                  {analysis.isValid ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {analysis.isValid 
                      ? '✅ Link do Supabase é válido!' 
                      : '❌ Link do Supabase é inválido'
                    }
                  </AlertDescription>
                </Alert>

                {/* Detalhes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Token:</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={showTokens ? analysis.token : '••••••••••••••••'} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowTokens(!showTokens)}
                      >
                        {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo:</Label>
                    <Badge variant={analysis.type === 'recovery' ? 'default' : 'destructive'}>
                      {analysis.type || 'Não encontrado'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Redirect To:</Label>
                    <div className="flex gap-2">
                      <Input value={analysis.redirectTo || 'Não encontrado'} readOnly />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(analysis.redirectTo || '')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Hostname:</Label>
                    <Badge variant="outline">{analysis.hostname}</Badge>
                  </div>
                </div>

                {/* URL Esperada */}
                {analysis.expectedRedirectUrl && (
                  <div className="space-y-2">
                    <Label>URL de Redirecionamento Esperada:</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={analysis.expectedRedirectUrl} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(analysis.expectedRedirectUrl)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={simulateRedirect}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={processLink}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        ✅ Processar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Parâmetros da URL Atual */}
                {analysis.extractedParams && (
                  <div className="space-y-2">
                    <Label>Parâmetros Extraídos da URL Atual:</Label>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                      {JSON.stringify(analysis.extractedParams, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Parâmetros Completos */}
                <div className="space-y-2">
                  <Label>Parâmetros Completos do Link:</Label>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(analysis.searchParams, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instruções */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Como usar:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Cole o link do email no campo acima</li>
              <li>Clique em "Analisar" para verificar a validade</li>
              <li>Use "Analisar URL Atual" para verificar a página atual</li>
              <li>Se o link for válido, use "Simular Redirecionamento" para testar</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
