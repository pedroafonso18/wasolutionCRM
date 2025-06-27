#!/bin/bash

# Script para gerar certificados SSL auto-assinados para desenvolvimento
echo "Gerando certificados SSL auto-assinados para desenvolvimento..."

# Verifica se o OpenSSL está instalado
if ! command -v openssl &> /dev/null; then
    echo "Erro: OpenSSL não está instalado. Por favor, instale o OpenSSL primeiro."
    exit 1
fi

# Gera os certificados
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=BR/ST=SP/L=Sao Paulo/O=WaSolCRM/OU=Development/CN=localhost"

if [ $? -eq 0 ]; then
    echo "✅ Certificados gerados com sucesso!"
    echo "📁 Arquivos criados:"
    echo "   - cert.pem (certificado)"
    echo "   - key.pem (chave privada)"
    echo ""
    echo "🔧 Para usar os certificados, adicione ao seu arquivo .env:"
    echo "   SSL_CERT=./cert.pem"
    echo "   SSL_KEY=./key.pem"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "   - Estes são certificados auto-assinados para desenvolvimento"
    echo "   - O navegador mostrará um aviso de segurança - aceite-o"
    echo "   - Para produção, use certificados válidos de uma CA"
else
    echo "❌ Erro ao gerar certificados"
    exit 1
fi 