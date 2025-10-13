from datetime import datetime
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
import numpy as np
import re
import os

# -----------------------------
# INICIALIZAR DASHBOARD_DATA
# -----------------------------
dashboard_data = {}
print("✅ dashboard_data inicializado")

# Configurar para suportar caracteres especiais
plt.rcParams["font.family"] = "DejaVu Sans"

print("🚀 INICIANDO PROCESSAMENTO DE DADOS...")

# -----------------------------
# Função para encontrar colunas automaticamente
# -----------------------------
def encontrar_coluna(df, padroes):
    for padrao in padroes:
        for col in df.columns:
            if pd.isna(col):
                continue
            if padrao.lower() in str(col).lower():
                return col
    return None

# -----------------------------
# Carregar dados da aba Dados_Brutos
# -----------------------------
try:
    df = pd.read_excel(
        "C:/Users/de.ferreira/OneDrive - VOLTALIA/09 - Arquivos WEG/11 - Analises SCADA/Projetos Imas e Callipers/dashboard_substituição_Ímãs_Eolico/Analise de Imas trocados.xlsx",
        sheet_name="Dados_Brutos"
    )
    
    print("✅ Arquivo carregado com sucesso!")
    print(f"📊 Dimensões: {df.shape[0]} linhas x {df.shape[1]} colunas")
    
except Exception as e:
    print(f"❌ Erro ao carregar arquivo: {e}")
    try:
        df = pd.read_excel("Analise de Troca de Imãs.xlsx", sheet_name="Dados_Brutos")
        print("✅ Arquivo carregado do diretório local!")
    except:
        print("❌ Não foi possível carregar o arquivo. Verifique o caminho.")
        exit()

# -----------------------------
# Identificar colunas automaticamente
# -----------------------------
mapeamento_colunas = {
    'data_inspecao': encontrar_coluna(df, ['data', 'data_inspeção', 'data inspeção', 'DATA INSPECAO', 'data']),
    'turbina': encontrar_coluna(df, ['turbina', 'aeg', 'TURBINA', 'AEG']),
    'qtd_imas_trocados': encontrar_coluna(df, ['qtd', 'quantidade', 'imas', 'trocados', 'QTD IMAS TROCADOS']),
    'ciclo_inspecao': encontrar_coluna(df, ['ciclo', 'CICLO INSPECAO', 'ciclo inspeção']),
    'status': encontrar_coluna(df, ['status', 'STATUS']),
    'os': encontrar_coluna(df, ['os', 'OS']),
    'cluster': encontrar_coluna(df, ['cluster', 'CLUSTER']),
    'observacao': encontrar_coluna(df, ['observação', 'observacao', 'OBSERVACOES', 'obs']),
    'dias_parada': encontrar_coluna(df, ['dias', 'parada', 'K1DIAS PARADA', 'dias_parada']),
    'downwind': encontrar_coluna(df, ['downwind', 'DOWNWIND']),
    'upwind': encontrar_coluna(df, ['upwind', 'UPWIND'])
}

print("/n🔍 MAPEAMENTO DE COLUNAS IDENTIFICADAS:")
for chave, valor in mapeamento_colunas.items():
    print(f"  {chave}: {valor}")

# Verificar colunas essenciais
colunas_essenciais = ['data_inspecao', 'turbina', 'qtd_imas_trocados']
colunas_faltantes = [chave for chave in colunas_essenciais if mapeamento_colunas[chave] is None]

if colunas_faltantes:
    print(f"/n❌ COLUNAS ESSENCIAIS FALTANTES: {colunas_faltantes}")
    print("📋 Colunas disponíveis:")
    for col in df.columns:
        print(f"  - {col}")
    exit()

# -----------------------------
# Padronizar nomes de colunas no DataFrame
# -----------------------------
df_clean = df.rename(columns={
    mapeamento_colunas['data_inspecao']: 'Data_inspecao',
    mapeamento_colunas['turbina']: 'Turbina',
    mapeamento_colunas['qtd_imas_trocados']: 'Qtd_Imas_trocados',
    mapeamento_colunas['ciclo_inspecao']: 'Ciclo_inspecao',
    mapeamento_colunas['status']: 'Status',
    mapeamento_colunas['os']: 'OS',
    mapeamento_colunas['cluster']: 'Cluster',
    mapeamento_colunas['observacao']: 'Observacao',
    mapeamento_colunas['dias_parada']: 'Dias_parada',
    mapeamento_colunas['downwind']: 'DOWNWIND',
    mapeamento_colunas['upwind']: 'UPWIND'
})

# Manter apenas colunas que existem
colunas_finais = []
for col in ['Data_inspecao', 'Turbina', 'Qtd_Imas_trocados', 'Ciclo_inspecao', 'Status', 'OS', 'Cluster', 'Observacao', 'Dias_parada', 'DOWNWIND', 'UPWIND']:
    if col in df_clean.columns:
        colunas_finais.append(col)

df_clean = df_clean[colunas_finais]

print(f"/n✅ DataFrame limpo: {df_clean.shape[1]} colunas")

# -----------------------------
# Limpeza e preparação dos dados
# -----------------------------
df_clean["Data_inspecao"] = pd.to_datetime(df_clean["Data_inspecao"], errors='coerce')
df_clean["Qtd_Imas_trocados"] = pd.to_numeric(df_clean["Qtd_Imas_trocados"], errors='coerce').fillna(0)

if 'Dias_parada' in df_clean.columns:
    df_clean["Dias_parada"] = pd.to_numeric(df_clean["Dias_parada"], errors='coerce').fillna(0)

if 'Ciclo_inspecao' in df_clean.columns:
    df_clean["Ciclo_inspecao"] = df_clean["Ciclo_inspecao"].fillna("Não Especificado")
if 'Status' in df_clean.columns:
    df_clean["Status"] = df_clean["Status"].fillna("Não Informado")
if 'Observacao' in df_clean.columns:
    df_clean["Observacao"] = df_clean["Observacao"].fillna("")

# Criar colunas derivadas
df_clean["Ano"] = df_clean["Data_inspecao"].dt.year
df_clean["Mes"] = df_clean["Data_inspecao"].dt.month
df_clean["Mes_Ano"] = df_clean["Data_inspecao"].dt.to_period('M')

print(f"/n📅 Período dos dados: {df_clean['Data_inspecao'].min()} a {df_clean['Data_inspecao'].max()}")
print(f"🧲 Total de ímãs trocados: {df_clean['Qtd_Imas_trocados'].sum():.0f}")
print(f"🌀 Total de turbinas únicas: {df_clean['Turbina'].nunique()}")

# -----------------------------
# ANÁLISE DE OXIDAÇÃO: Dados por Ciclo (aba Dados_Brutos - DOWNWIND/UPWIND)
# -----------------------------
print("/n🔬 INICIANDO ANÁLISE DE OXIDAÇÃO - DOWNWIND/UPWIND...")

# Usar o df_clean que já foi carregado da aba Dados_Brutos
if all(col in df_clean.columns for col in ['DOWNWIND', 'UPWIND', 'Ciclo_inspecao']):
    print("✅ Colunas DOWNWIND/UPWIND encontradas para análise de oxidação")
    
    # Ciclos para análise
    ciclos_analise = ['Primeiro Ciclo', 'Segundo Ciclo', 'Terceiro Ciclo', 'Troca de Spindle']
    
    oxidacao_data = []
    
    for ciclo in ciclos_analise:
        ciclo_df = df_clean[df_clean["Ciclo_inspecao"] == ciclo]
        
        print(f"/n🔍 Analisando ciclo: {ciclo}")
        print(f"   📊 Total de registros: {len(ciclo_df)}")
        
        # CONTAGEM DE OXIDAÇÃO POR NÍVEL
        oxidacao_baixa = 0
        oxidacao_media = 0
        oxidacao_alta = 0
        
        for _, row in ciclo_df.iterrows():
            downwind = str(row['DOWNWIND']).strip().upper() if pd.notna(row['DOWNWIND']) else ''
            upwind = str(row['UPWIND']).strip().upper() if pd.notna(row['UPWIND']) else ''
            
            # Classificar oxidação baseado em DOWNWIND e UPWIND
            # Considerar o pior cenário entre os dois lados
            if 'ALTO' in downwind or 'ALTO' in upwind:
                oxidacao_alta += 1
            elif 'MÉDIO' in downwind or 'MÉDIO' in upwind or 'MEDIO' in downwind or 'MEDIO' in upwind:
                oxidacao_media += 1
            elif 'BAIXO' in downwind or 'BAIXO' in upwind:
                oxidacao_baixa += 1
            # Se não classificado, verificar se há algum valor
            elif downwind or upwind:
                # Tentar classificar pelo texto contido
                if any(palavra in downwind.upper() or palavra in upwind.upper() 
                      for palavra in ['ALTO', 'ALTA', 'HIGH']):
                    oxidacao_alta += 1
                elif any(palavra in downwind.upper() or palavra in upwind.upper() 
                        for palavra in ['MÉDIO', 'MEDIO', 'MEDIA', 'MÉDIA', 'MEDIUM']):
                    oxidacao_media += 1
                elif any(palavra in downwind.upper() or palavra in upwind.upper() 
                        for palavra in ['BAIXO', 'BAIXA', 'LOW']):
                    oxidacao_baixa += 1
                else:
                    # Se não reconhecer, considerar como não classificado (opcional)
                    pass
        
        print(f"   🧲 Oxidação - Baixa: {oxidacao_baixa}, Média: {oxidacao_media}, Alta: {oxidacao_alta}")
        
        oxidacao_data.append({
            "Ciclo_Inspecao": str(ciclo),
            "Oxidacao_Baixa": int(oxidacao_baixa),
            "Oxidacao_Media": int(oxidacao_media),
            "Oxidacao_Alta": int(oxidacao_alta),
            "Total_Registros": int(len(ciclo_df))
        })
    
    # Criar DataFrame de oxidação
    oxidacao_df = pd.DataFrame(oxidacao_data)
    
    # Calcular totais e percentuais
    oxidacao_df["Total_Oxidacao"] = oxidacao_df["Oxidacao_Baixa"] + oxidacao_df["Oxidacao_Media"] + oxidacao_df["Oxidacao_Alta"]
    oxidacao_df["Percentual_Com_Oxidacao"] = (oxidacao_df["Total_Oxidacao"] / oxidacao_df["Total_Registros"] * 100).round(2)
    
    print(f"/n✅ Análise de oxidação concluída - {len(oxidacao_df)} ciclos processados")
    print("/n📋 RESUMO DE OXIDAÇÃO POR CICLO:")
    for _, row in oxidacao_df.iterrows():
        print(f"   {row['Ciclo_Inspecao']}:")
        print(f"      Baixa: {row['Oxidacao_Baixa']}")
        print(f"      Média: {row['Oxidacao_Media']}") 
        print(f"      Alta: {row['Oxidacao_Alta']}")
        print(f"      Total com oxidação: {row['Total_Oxidacao']} ({row['Percentual_Com_Oxidacao']}%)")
    
else:
    print("❌ Colunas DOWNWIND/UPWIND não encontradas para análise de oxidação")
    oxidacao_df = pd.DataFrame({
        "Ciclo_Inspecao": ['Primeiro Ciclo', 'Segundo Ciclo', 'Terceiro Ciclo', 'Troca de Spindle'],
        "Oxidacao_Baixa": [0, 0, 0, 0],
        "Oxidacao_Media": [0, 0, 0, 0],
        "Oxidacao_Alta": [0, 0, 0, 0],
        "Total_Registros": [0, 0, 0, 0],
        "Total_Oxidacao": [0, 0, 0, 0],
        "Percentual_Com_Oxidacao": [0, 0, 0, 0]
    })

# -----------------------------
# ANÁLISE TEMPORAL DE OXIDAÇÕES POR CICLO
# -----------------------------
print("/n📅 INICIANDO ANÁLISE TEMPORAL DE OXIDAÇÕES...")

if all(col in df_clean.columns for col in ['DOWNWIND', 'UPWIND', 'Ciclo_inspecao', 'Data_inspecao']):
    print("✅ Colunas encontradas para análise temporal de oxidações")
    
    # Criar coluna de mês/ano para agrupamento temporal
    df_clean['Mes_Ano'] = df_clean['Data_inspecao'].dt.to_period('M')
    
    # Ciclos para análise
    ciclos_analise = ['Primeiro Ciclo', 'Segundo Ciclo', 'Terceiro Ciclo']
    
    # Dados temporais por ciclo
    oxidacao_temporal_data = []
    
    for ciclo in ciclos_analise:
        print(f"/n🔍 Processando ciclo: {ciclo}")
        
        # Filtrar dados do ciclo
        ciclo_df = df_clean[df_clean["Ciclo_inspecao"] == ciclo]
        
        # Agrupar por mês/ano
        temporal_grouped = ciclo_df.groupby('Mes_Ano').agg({
            'DOWNWIND': 'count'  # Contar total de registros por mês
        }).reset_index()
        temporal_grouped.columns = ['Mes_Ano', 'Total_Registros']
        
        # Calcular oxidações por mês
        for mes_ano in temporal_grouped['Mes_Ano'].unique():
            mes_df = ciclo_df[ciclo_df['Mes_Ano'] == mes_ano]
            
            oxidacao_baixa = 0
            oxidacao_media = 0
            oxidacao_alta = 0
            
            for _, row in mes_df.iterrows():
                downwind = str(row['DOWNWIND']).strip().upper() if pd.notna(row['DOWNWIND']) else ''
                upwind = str(row['UPWIND']).strip().upper() if pd.notna(row['UPWIND']) else ''
                
                # Classificar oxidação
                if 'ALTO' in downwind or 'ALTO' in upwind:
                    oxidacao_alta += 1
                elif 'MÉDIO' in downwind or 'MÉDIO' in upwind or 'MEDIO' in downwind or 'MEDIO' in upwind:
                    oxidacao_media += 1
                elif 'BAIXO' in downwind or 'BAIXO' in upwind:
                    oxidacao_baixa += 1
            
            total_mes = len(mes_df)
            
            oxidacao_temporal_data.append({
                "Ciclo": ciclo,
                "Mes_Ano": str(mes_ano),
                "Oxidacao_Baixa": oxidacao_baixa,
                "Oxidacao_Media": oxidacao_media,
                "Oxidacao_Alta": oxidacao_alta,
                "Total_Registros": total_mes,
                "Total_Oxidacao": oxidacao_baixa + oxidacao_media + oxidacao_alta,
                "Percentual_Oxidacao": round(((oxidacao_baixa + oxidacao_media + oxidacao_alta) / total_mes * 100), 2) if total_mes > 0 else 0
            })
    
    # Criar DataFrame temporal
    oxidacao_temporal_df = pd.DataFrame(oxidacao_temporal_data)
    
    print(f"/n✅ Análise temporal concluída - {len(oxidacao_temporal_df)} registros processados")
    
    # Mostrar resumo por ciclo
    for ciclo in ciclos_analise:
        ciclo_data = oxidacao_temporal_df[oxidacao_temporal_df['Ciclo'] == ciclo]
        if len(ciclo_data) > 0:
            total_baixa = ciclo_data['Oxidacao_Baixa'].sum()
            total_media = ciclo_data['Oxidacao_Media'].sum()
            total_alta = ciclo_data['Oxidacao_Alta'].sum()
            print(f"/n📊 {ciclo}:")
            print(f"   Baixa: {total_baixa} | Média: {total_media} | Alta: {total_alta}")
    
else:
    print("❌ Colunas necessárias não encontradas")
    oxidacao_temporal_df = pd.DataFrame()

print("/n📈 ANALISANDO VARIAÇÃO ENTRE CICLOS (CORRIGIDA)...")

# Calcular totais por ciclo para comparação
variacao_ciclos_data = []

for ciclo in ciclos_analise:
    ciclo_data = df_clean[df_clean["Ciclo_inspecao"] == ciclo]
    
    if len(ciclo_data) > 0:
        oxidacao_baixa = 0
        oxidacao_media = 0
        oxidacao_alta = 0
        sem_oxidacao = 0
        troca_spindle = 0
        valores_invalidos = 0
        
        for _, row in ciclo_data.iterrows():
            downwind = str(row['DOWNWIND']).strip().upper() if pd.notna(row['DOWNWIND']) else ''
            upwind = str(row['UPWIND']).strip().upper() if pd.notna(row['UPWIND']) else ''
            
            # >>>>> LÓGICA CORRIGIDA <<<<<
            # Juntar e limpar os dois campos para análise
            texto_completo = f"{downwind} {upwind}".strip()
            texto_limpo = texto_completo.replace('-', '').replace(' ', '').replace('.', '').upper()
            
            # Verificar se está vazio
            if not texto_limpo:
                sem_oxidacao += 1
                continue
            
            # CLASSIFICAÇÃO CORRIGIDA - verificar em ambos os campos
            if 'TROCADESPINDLE' in texto_limpo or 'TROCA DE SPINDLE' in texto_completo:
                troca_spindle += 1
            elif 'ALTO' in texto_completo:
                oxidacao_alta += 1
            elif 'MÉDIO' in texto_completo or 'MEDIO' in texto_completo:
                oxidacao_media += 1
            elif 'BAIXO' in texto_completo:
                oxidacao_baixa += 1
            else:
                # Se não reconhecer nenhum padrão, considerar inválido
                valores_invalidos += 1
        
        total_ciclo = len(ciclo_data)
        total_oxidacao = oxidacao_baixa + oxidacao_media + oxidacao_alta + troca_spindle
        
        variacao_ciclos_data.append({
            "Ciclo": ciclo,
            "Oxidacao_Baixa": oxidacao_baixa,
            "Oxidacao_Media": oxidacao_media,
            "Oxidacao_Alta": oxidacao_alta,
            "Troca_Spindle": troca_spindle,
            "Sem_Oxidacao": sem_oxidacao,
            "Valores_Invalidos": valores_invalidos,
            "Total_Registros": total_ciclo,
            "Total_Oxidacao": total_oxidacao,
            "Percentual_Oxidacao": round((total_oxidacao / total_ciclo * 100), 2) if total_ciclo > 0 else 0,
            "Percentual_Baixa": round((oxidacao_baixa / total_ciclo * 100), 2) if total_ciclo > 0 else 0,
            "Percentual_Media": round((oxidacao_media / total_ciclo * 100), 2) if total_ciclo > 0 else 0,
            "Percentual_Alta": round((oxidacao_alta / total_ciclo * 100), 2) if total_ciclo > 0 else 0,
            "Percentual_Troca_Spindle": round((troca_spindle / total_ciclo * 100), 2) if total_ciclo > 0 else 0,
            "Percentual_Sem_Oxidacao": round((sem_oxidacao / total_ciclo * 100), 2) if total_ciclo > 0 else 0
        })

variacao_ciclos_df = pd.DataFrame(variacao_ciclos_data)

print("/n📊 VARIAÇÃO ENTRE CICLOS (CORRIGIDA):")
for _, row in variacao_ciclos_df.iterrows():
    print(f"   {row['Ciclo']}:")
    print(f"      Registros: {row['Total_Registros']}")
    print(f"      Oxidações: {row['Total_Oxidacao']} ({row['Percentual_Oxidacao']}%)")
    print(f"      Distribuição: B{row['Oxidacao_Baixa']}({row['Percentual_Baixa']}%) / M{row['Oxidacao_Media']}({row['Percentual_Media']}%) / A{row['Oxidacao_Alta']}({row['Percentual_Alta']}%)")
    print(f"      Troca Spindle: {row['Troca_Spindle']} ({row['Percentual_Troca_Spindle']}%)")
    print(f"      Sem oxidação: {row['Sem_Oxidacao']} ({row['Percentual_Sem_Oxidacao']}%)")
    print(f"      Inválidos: {row['Valores_Invalidos']}")

# -----------------------------
# PREPARAR DADOS TEMPORAIS PARA JSON
# -----------------------------
print("/n💾 PREPARANDO DADOS TEMPORAIS PARA DASHBOARD...")

# Dados temporais para gráficos de linha
oxidacao_temporal_json = {
    "temporal_por_mes": [
        {
            "Ciclo": row["Ciclo"],
            "Mes_Ano": row["Mes_Ano"],
            "Oxidacao_Baixa": int(row["Oxidacao_Baixa"]),
            "Oxidacao_Media": int(row["Oxidacao_Media"]),
            "Oxidacao_Alta": int(row["Oxidacao_Alta"]),
            "Total_Registros": int(row["Total_Registros"]),
            "Total_Oxidacao": int(row["Total_Oxidacao"]),
            "Percentual_Oxidacao": float(row["Percentual_Oxidacao"])
        }
        for _, row in oxidacao_temporal_df.iterrows()
    ],
    "variacao_entre_ciclos": [
        {
            "Ciclo": row["Ciclo"],
            "Oxidacao_Baixa": int(row["Oxidacao_Baixa"]),
            "Oxidacao_Media": int(row["Oxidacao_Media"]),
            "Oxidacao_Alta": int(row["Oxidacao_Alta"]),
            "Total_Registros": int(row["Total_Registros"]),
            "Total_Oxidacao": int(row["Total_Oxidacao"]),
            "Percentual_Oxidacao": float(row["Percentual_Oxidacao"]),
            "Percentual_Baixa": float(row["Percentual_Baixa"]),
            "Percentual_Media": float(row["Percentual_Media"]),
            "Percentual_Alta": float(row["Percentual_Alta"])
        }
        for _, row in variacao_ciclos_df.iterrows()
    ]
}

if 'dashboard_data' not in locals():
    dashboard_data = {}
    print("✅ dashboard_data criado")

dashboard_data["oxidacao_temporal"] = oxidacao_temporal_json

print("✅ Dados temporais de oxidação integrados ao dashboard_data")

# -----------------------------
# ANÁLISE DE MÁQUINAS PARADAS POR CICLO
# -----------------------------
print("/n📊 INICIANDO ANÁLISE DE MÁQUINAS PARADAS POR CICLO...")

# Verificar se as colunas necessárias existem
colunas_necessarias = ['Data_inspecao', 'Turbina', 'Ciclo_inspecao', 'Status']
coluna_data_substituicao = 'data_substituicao'

# Verificar qual coluna de data de substituição existe
possiveis_nomes_substituicao = ['datasubstituicao', 'data_retorno', 'data_fim_parada', 'data_substituição']
coluna_substituicao_encontrada = None

for nome in possiveis_nomes_substituicao:
    if nome in df_clean.columns:
        coluna_substituicao_encontrada = nome
        break

if coluna_substituicao_encontrada:
    colunas_necessarias.append(coluna_substituicao_encontrada)
    print(f"✅ Coluna de data de substituição encontrada: {coluna_substituicao_encontrada}")
else:
    print("⚠️ Coluna de data de substituição não encontrada, usando data de inspeção como fallback")

# Verificar se temos as colunas mínimas necessárias
if all(col in df_clean.columns for col in ['Data_inspecao', 'Turbina', 'Ciclo_inspecao', 'Status']):
    print("✅ Colunas necessárias encontradas para análise de máquinas paradas")
    
    # Ciclos para análise
    ciclos_analise = ['Primeiro Ciclo', 'Segundo Ciclo', 'Terceiro Ciclo', 'Troca de Spindle']
    
    maquinas_paradas_data = []
    
    for ciclo in ciclos_analise:
        print(f"/n🔍 Processando ciclo: {ciclo}")
        
        # Filtrar dados do ciclo
        ciclo_df = df_clean[df_clean["Ciclo_inspecao"] == ciclo]
        
        # Identificar máquinas paradas - múltiplos critérios
        criterios_parada = [
            ciclo_df["Status"].str.contains('Fora de Operação', case=False, na=False),
            ciclo_df["Status"].str.contains('down|offline|inativa', case=False, na=False),
            #ciclo_df["Qtd_Imas_trocados"] > 0  # Se trocou ímãs, provavelmente parou
        ]
        
        # Combinar critérios
        mascara_paradas = criterios_parada[0]
        for criterio in criterios_parada[1:]:
            mascara_paradas = mascara_paradas | criterio
        
        maquinas_paradas_ciclo = ciclo_df[mascara_paradas]
        
        print(f"   📋 Máquinas paradas identificadas: {len(maquinas_paradas_ciclo)}")
        
        # Processar cada máquina parada
        for _, row in maquinas_paradas_ciclo.iterrows():
            try:
                data_inspecao = row['Data_inspecao']
                turbina = row['Turbina']
                status = row['Status']
                
                # Determinar data de retorno
                if coluna_substituicao_encontrada and pd.notna(row[coluna_substituicao_encontrada]):
                    data_retorno = row[coluna_substituicao_encontrada]
                else:
                    # Se não há data de substituição, estimar baseado em padrões históricos
                    dias_parada_estimados = {
                        'Primeiro Ciclo': 120,
                        'Segundo Ciclo': 90,
                        'Terceiro Ciclo': 75,
                        'Troca de Spindle': 60
                    }
                    dias_estimados = dias_parada_estimados.get(ciclo, 30)
                    data_retorno = data_inspecao + pd.Timedelta(days=dias_estimados)
                
                # Calcular dias de parada
                if pd.notna(data_retorno) and pd.notna(data_inspecao):
                    dias_parada = (data_retorno - data_inspecao).days
                    dias_parada = max(dias_parada, 1)  # Mínimo 1 dia
                else:
                    dias_parada = 0
                
                # Formatar datas para o padrão brasileiro
                data_parada_formatada = data_inspecao.strftime("%d/%m/%Y") if pd.notna(data_inspecao) else "N/A"
                data_retorno_formatada = data_retorno.strftime("%d/%m/%Y") if pd.notna(data_retorno) else "N/A"
                
                # Adicionar ao dataset
                maquinas_paradas_data.append({
                    "ciclo": ciclo,
                    "data_parada": data_parada_formatada,
                    "turbina": turbina,
                    "data_retorno": data_retorno_formatada,
                    "dias_parada": dias_parada,
                    "status": status
                })
                
            except Exception as e:
                print(f"   ⚠️ Erro ao processar linha: {e}")
                continue
    
    print(f"/n✅ Análise concluída - {len(maquinas_paradas_data)} registros de máquinas paradas processados")
    
else:
    print("❌ Colunas necessárias não encontradas para análise de máquinas paradas")
    maquinas_paradas_data = []

# -----------------------------
# SALVAR DADOS NO FORMATO SOLICITADO
# -----------------------------
print("/n💾 PREPARANDO DADOS PARA JSON...")

# Formatar dados no padrão solicitado
maquinas_paradas_formatadas = []

for registro in maquinas_paradas_data:
    maquinas_paradas_formatadas.append({
        "Data da Parada": registro["data_parada"],
        "Tag da Turbina": registro["turbina"],
        "Data de Retorno": registro["data_retorno"],
        "Dias Parada": registro["dias_parada"],
        "Ciclo": registro["ciclo"],
        "Status": registro["status"]
    })

# Agrupar por ciclo para organização
maquinas_por_ciclo = {
    "primeiro_ciclo": [m for m in maquinas_paradas_formatadas if m["Ciclo"] == "Primeiro Ciclo"],
    "segundo_ciclo": [m for m in maquinas_paradas_formatadas if m["Ciclo"] == "Segundo Ciclo"],
    "terceiro_ciclo": [m for m in maquinas_paradas_formatadas if m["Ciclo"] == "Terceiro Ciclo"],
    "troca_spindle": [m for m in maquinas_paradas_formatadas if m["Ciclo"] == "Troca de Spindle"]
}

# Criar estrutura final do JSON
maquinas_paradas_json = {
    "maquinas_paradas": maquinas_paradas_formatadas,
    "resumo_por_ciclo": {
        "primeiro_ciclo": len(maquinas_por_ciclo["primeiro_ciclo"]),
        "segundo_ciclo": len(maquinas_por_ciclo["segundo_ciclo"]),
        "terceiro_ciclo": len(maquinas_por_ciclo["terceiro_ciclo"]),
        "troca_spindle": len(maquinas_por_ciclo["troca_spindle"]),
        "total_geral": len(maquinas_paradas_formatadas)
    },
    "detalhes_por_ciclo": maquinas_por_ciclo
}

# -----------------------------
# SALVAR ARQUIVO SEPARADO PARA MÁQUINAS PARADAS
# -----------------------------
try:
    # Usar o mesmo assets_path do seu código original
    assets_path = r"C:/Users/de.ferreira/OneDrive - VOLTALIA/09 - Arquivos WEG/11 - Analises SCADA/Projetos Imas e Callipers/dashboard_substituição_Ímãs_Eolico/src/assets"
    
    if not os.path.exists(assets_path):
        os.makedirs(assets_path)
        print(f"📁 Diretório criado: {assets_path}")
    
    # Salvar arquivo separado para máquinas paradas
    maquinas_paradas_path = os.path.join(assets_path, "maquinas_paradas.json")
    with open(maquinas_paradas_path, "w", encoding="utf-8") as f:
        json.dump(maquinas_paradas_json, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Arquivo de máquinas paradas salvo: {maquinas_paradas_path}")
    
except Exception as e:
    print(f"❌ Erro ao salvar arquivo de máquinas paradas: {e}")
    # Salvar no diretório atual como fallback
    current_dir = os.getcwd()
    backup_path = os.path.join(current_dir, "maquinas_paradas.json")
    with open(backup_path, "w", encoding="utf-8") as f:
        json.dump(maquinas_paradas_json, f, ensure_ascii=False, indent=2)
    print(f"✅ Arquivo salvo em backup: {backup_path}")

# -----------------------------
# RELATÓRIO FINAL
# -----------------------------
print("/n" + "="*60)
print("📋 RELATÓRIO DE MÁQUINAS PARADAS POR CICLO")
print("="*60)

for ciclo in ['Primeiro Ciclo', 'Segundo Ciclo', 'Terceiro Ciclo', 'Troca de Spindle']:
    quantidade = len([m for m in maquinas_paradas_formatadas if m["Ciclo"] == ciclo])
    print(f"📊 {ciclo}: {quantidade} máquinas paradas")

print(f"/n📈 Total Geral: {len(maquinas_paradas_formatadas)} máquinas paradas")

# Mostrar exemplos
if maquinas_paradas_formatadas:
    print("/n🔍 EXEMPLOS DE REGISTROS:")
    for i, exemplo in enumerate(maquinas_paradas_formatadas[:3], 1):
        print(f"  {i}. {exemplo['Data da Parada']} | {exemplo['Tag da Turbina']} | {exemplo['Data de Retorno']} | {exemplo['Dias Parada']} dias")

print("="*60)

# -----------------------------
# ANÁLISE MICRO: Dados por Carreiras (aba Carreiras_Vertical)
# -----------------------------
print("/n🔍 INICIANDO ANÁLISE MICRO - CARREIRAS...")

try:
    # Carregar a aba Carreiras_Vertical
    df_carreiras = pd.read_excel(
        "C:/Users/de.ferreira/OneDrive - VOLTALIA/09 - Arquivos WEG/11 - Analises SCADA/Projetos Imas e Callipers/dashboard_substituição_Ímãs_Eolico/Analise de Imas trocados.xlsx",
        sheet_name="Carreiras_Vertical"
    )
    
    print(f"✅ Aba 'Carreiras_Vertical' carregada: {df_carreiras.shape[0]} linhas x {df_carreiras.shape[1]} colunas")
    print(f"📋 Colunas: {list(df_carreiras.columns)}")
    
except Exception as e:
    print(f"❌ Erro ao carregar aba Carreiras_Vertical: {e}")
    df_carreiras = pd.DataFrame()

# Processar dados de carreiras
carreiras_data = []

if not df_carreiras.empty:
    # Identificar colunas automaticamente na aba Carreiras_Vertical
    mapeamento_carreiras = {
        'turbina': encontrar_coluna(df_carreiras, ['aeg', 'turbina']),
        'carreira': encontrar_coluna(df_carreiras, ['carreira']),
        'qtd_imas': encontrar_coluna(df_carreiras, ['qtd', 'quantidade', 'imas']),
        'data_inspecao': encontrar_coluna(df_carreiras, ['data', 'data_inspeção']),
        'os': encontrar_coluna(df_carreiras, ['os']),
        'ciclo': encontrar_coluna(df_carreiras, ['ciclo']),
        'status': encontrar_coluna(df_carreiras, ['status'])
    }
    
    print(f"📍 Mapeamento Carreiras_Vertical:")
    for chave, valor in mapeamento_carreiras.items():
        print(f"  {chave}: {valor}")
    
    # Processar dados se temos as colunas essenciais
    if (mapeamento_carreiras['turbina'] and 
        mapeamento_carreiras['carreira'] and 
        mapeamento_carreiras['qtd_imas']):
        
        for index, row in df_carreiras.iterrows():
            try:
                turbina = str(row[mapeamento_carreiras['turbina']]).strip() if pd.notna(row[mapeamento_carreiras['turbina']]) else None
                carreira = str(row[mapeamento_carreiras['carreira']]).strip() if pd.notna(row[mapeamento_carreiras['carreira']]) else None
                qtd_imas = pd.to_numeric(row[mapeamento_carreiras['qtd_imas']], errors='coerce') if pd.notna(row[mapeamento_carreiras['qtd_imas']]) else 0
                
                if (turbina and carreira and carreira != '-' and carreira != 'nan' and qtd_imas > 0):
                    # Formatar carreira para C-XX
                    if carreira.isdigit():
                        carreira_formatada = f"C-{carreira.zfill(2)}"
                    else:
                        carreira_formatada = carreira
                    
                    carreiras_data.append({
                        "Turbina": turbina,
                        "Carreira": carreira_formatada,
                        "Imas_Trocados": qtd_imas
                    })
                    
            except Exception as e:
                continue

print(f"📊 Carreiras processadas: {len(carreiras_data)} registros")

# Criar DataFrame consolidado de carreiras
if carreiras_data:
    carreiras_df = pd.DataFrame(carreiras_data)
    
    # Agregar dados por carreira
    carreira_metrics = carreiras_df.groupby("Carreira").agg({
        "Imas_Trocados": ["sum", "count"],
        "Turbina": "nunique"
    }).reset_index()

    carreira_metrics.columns = ["Carreira", "Total_Imas_Trocados", "Total_Intervencoes", "Turbinas_Afetadas"]
    
    # Calcular média de ímãs por turbina
    carreira_metrics["Media_Imas_Por_Turbina"] = carreira_metrics.apply(
        lambda row: row["Total_Imas_Trocados"] / row["Turbinas_Afetadas"] if row["Turbinas_Afetadas"] > 0 else 0, 
        axis=1
    )
    
    # Ordenar por total de ímãs trocados
    carreira_metrics = carreira_metrics.sort_values("Total_Imas_Trocados", ascending=False)
    
    print(f"✅ Análise micro concluída - {len(carreira_metrics)} carreiras identificadas")
    
else:
    carreira_metrics = pd.DataFrame(columns=[
        "Carreira", "Total_Imas_Trocados", "Turbinas_Afetadas", 
        "Total_Intervencoes", "Media_Imas_Por_Turbina"
    ])

# -----------------------------
# ANÁLISE DE CRITICIDADE: Dados por Ciclo (aba Dados_Brutos - DOWNWIND/UPWIND)
# -----------------------------
print("/n🚨 INICIANDO ANÁLISE DE CRITICIDADE - DOWNWIND/UPWIND...")

# Usar o df_clean que já foi carregado da aba Dados_Brutos
if all(col in df_clean.columns for col in ['DOWNWIND', 'UPWIND', 'Ciclo_inspecao']):
    print("✅ Colunas DOWNWIND/UPWIND encontradas para análise de criticidade")
    
    # Ciclos para análise
    ciclos_analise = ['Primeiro Ciclo', 'Segundo Ciclo', 'Terceiro Ciclo', 'Troca de Spindle']
    
    ciclos_data = []
    
    for ciclo in ciclos_analise:
        ciclo_df = df_clean[df_clean["Ciclo_inspecao"] == ciclo]
        
        print(f"/n🔍 Analisando ciclo: {ciclo}")
        print(f"   📊 Total de registros: {len(ciclo_df)}")
        
        # Métricas principais
        if 'Status' in df_clean.columns:
            maquinas_paradas_unicas = ciclo_df.loc[
                ciclo_df["Status"].str.contains('fora|parada|stop', case=False, na=False), 
                "Turbina"
            ].nunique()
        else:
            maquinas_paradas_unicas = 0
            
        imans_trocados = ciclo_df["Qtd_Imas_trocados"].sum()
        
        # ANÁLISE DE CRITICIDADE POR DOWNWIND/UPWIND
        crit_baixo = 0
        crit_medio = 0
        crit_alto = 0
        
        for _, row in ciclo_df.iterrows():
            downwind = str(row['DOWNWIND']).strip().upper() if pd.notna(row['DOWNWIND']) else ''
            upwind = str(row['UPWIND']).strip().upper() if pd.notna(row['UPWIND']) else ''
            
            # Classificar criticidade baseado em DOWNWIND e UPWIND
            if downwind == 'ALTO' and upwind == 'ALTO':
                crit_alto += 1
            elif downwind == 'ALTO' or upwind == 'ALTO':
                crit_medio += 1
            elif downwind == 'BAIXO' and upwind == 'BAIXO':
                crit_baixo += 1
            elif downwind == 'BAIXO' or upwind == 'BAIXO':
                crit_baixo += 1
            # Se não classificado, considerar médio por padrão
            elif downwind or upwind:
                crit_medio += 1
        
        print(f"   🚨 Criticidade - Baixo: {crit_baixo}, Médio: {crit_medio}, Alto: {crit_alto}")
        
        # Dias de parada
        if 'Dias_parada' in df_clean.columns:
            dias_parada_medio = ciclo_df["Dias_parada"].mean() if len(ciclo_df) > 0 else 0
        else:
            dias_parada_medio = 0
        
        ciclos_data.append({
            "Ciclo": str(ciclo),
            "Maquinas_Paradas": int(maquinas_paradas_unicas),
            "Imas_Trocados": float(imans_trocados),
            "Criticidade_Baixa": int(crit_baixo),
            "Criticidade_Media": int(crit_medio),
            "Criticidade_Alta": int(crit_alto),
            "Dias_Parada_Medio": round(float(dias_parada_medio),2)
        })
    
    print(f"✅ Análise de criticidade concluída - {len(ciclos_data)} ciclos processados")
    
else:
    print("❌ Colunas DOWNWIND/UPWIND não encontradas para análise de criticidade")
    ciclos_data = [{
        "Ciclo": "Dados Indisponíveis",
        "Maquinas_Paradas": 0,
        "Imas_Trocados": 0,
        "Criticidade_Baixa": 0,
        "Criticidade_Media": 0,
        "Criticidade_Alta": 0,
        "Dias_Parada_Medio": 0
    }]

ciclos_df = pd.DataFrame(ciclos_data)

# -----------------------------
# ANÁLISE MÉSIO: Dados por Turbina
# -----------------------------
print("/n📊 INICIANDO ANÁLISE MÉSIO...")

# Agrupar dados por turbina
agg_config = {
    "Qtd_Imas_trocados": "sum",
    "Data_inspecao": ["min", "max", "count"]
}

if 'Dias_parada' in df_clean.columns:
    agg_config["Dias_parada"] = "sum"

turbina_metrics = df_clean.groupby("Turbina").agg(agg_config).reset_index()

# Ajustar nomes das colunas
new_columns = ["Turbina", "Total_Imas_Trocados", "Primeira_Inspecao", "Ultima_Inspecao", "Total_Inspecoes"]
if 'Dias_parada' in df_clean.columns:
    new_columns.append("Dias_Parada_Acumulados")

turbina_metrics.columns = new_columns

if 'Dias_Parada_Acumulados' not in turbina_metrics.columns:
    turbina_metrics["Dias_Parada_Acumulados"] = 0

# Calcular métricas de confiabilidade
hoje = datetime.now()
turbina_metrics["MTBF_Dias"] = turbina_metrics.apply(
    lambda row: (hoje - row["Primeira_Inspecao"]).days / row["Total_Imas_Trocados"] 
    if row["Total_Imas_Trocados"] > 0 and pd.notna(row["Primeira_Inspecao"]) else 0, axis=1
)
turbina_metrics["MTTR_Dias"] = turbina_metrics.apply(
    lambda row: row["Dias_Parada_Acumulados"] / row["Total_Imas_Trocados"] 
    if row["Total_Imas_Trocados"] > 0 else 0, axis=1
)

# Classificar risco
def classificar_risco(total_imas, total_inspecoes):
    if total_imas > 20 or (total_imas > 10 and total_inspecoes > 5):
        return "🟥 ALTO RISCO"
    elif total_imas > 10 or (total_imas > 5 and total_inspecoes > 3):
        return "🟨 MÉDIO RISCO"
    else:
        return "🟩 BAIXO RISCO"

turbina_metrics["Nivel_Risco"] = turbina_metrics.apply(
    lambda row: classificar_risco(row["Total_Imas_Trocados"], row["Total_Inspecoes"]), axis=1
)

print("✅ Análise mésio concluída")

# -----------------------------
# ANÁLISE TEMPORAL: Evolução Mensal
# -----------------------------
print("/n📅 INICIANDO ANÁLISE TEMPORAL...")

mensal_data = df_clean.groupby("Mes_Ano").agg({
    "Qtd_Imas_trocados": "sum",
    "Turbina": "nunique"
}).reset_index()

mensal_data.columns = ["Mes_Ano", "Imas_Trocados", "Turbinas_Unicas"]
mensal_data["Mes_Ano"] = mensal_data["Mes_Ano"].astype(str)

if 'Dias_parada' in df_clean.columns:
    dias_mensal = df_clean.groupby("Mes_Ano")["Dias_parada"].sum().reset_index()
    dias_mensal.columns = ["Mes_Ano", "Dias_Parada_Total"]
    dias_mensal["Mes_Ano"] = dias_mensal["Mes_Ano"].astype(str)
    mensal_data = mensal_data.merge(dias_mensal, on="Mes_Ano", how="left")
else:
    mensal_data["Dias_Parada_Total"] = 0

print("✅ Análise temporal concluída")

# -----------------------------
# CÁLCULO DE OXIDAÇÃO APENAS DA ÚLTIMA INSPEÇÃO
# -----------------------------
print("/n🔬 CALCULANDO OXIDAÇÃO DA ÚLTIMA INSPEÇÃO...")

# Ordenar por data e pegar a última inspeção de cada turbina
df_clean_sorted = df_clean.sort_values('Data_inspecao', ascending=False)
ultimas_inspecoes = df_clean_sorted.drop_duplicates('Turbina', keep='first')

print(f"📊 Últimas inspeções de {len(ultimas_inspecoes)} turbinas processadas")

# Calcular oxidação apenas das últimas inspeções
oxidacao_ultima_inspecao = {
    'baixa': 0,
    'media': 0, 
    'alta': 0
}

for _, row in ultimas_inspecoes.iterrows():
    downwind = str(row['DOWNWIND']).strip().upper() if pd.notna(row['DOWNWIND']) else ''
    upwind = str(row['UPWIND']).strip().upper() if pd.notna(row['UPWIND']) else ''
    
    # Classificar oxidação (mesma lógica anterior)
    if 'ALTO' in downwind or 'ALTO' in upwind:
        oxidacao_ultima_inspecao['alta'] += 1
    elif 'MÉDIO' in downwind or 'MÉDIO' in upwind or 'MEDIO' in downwind or 'MEDIO' in upwind:
        oxidacao_ultima_inspecao['media'] += 1
    elif 'BAIXO' in downwind or 'BAIXO' in upwind:
        oxidacao_ultima_inspecao['baixa'] += 1

total_oxidacao_ultima_inspecao = (
    oxidacao_ultima_inspecao['baixa'] + 
    oxidacao_ultima_inspecao['media'] + 
    oxidacao_ultima_inspecao['alta']
)

print(f"🧲 Oxidação última inspeção - Baixa: {oxidacao_ultima_inspecao['baixa']}, " +
      f"Média: {oxidacao_ultima_inspecao['media']}, Alta: {oxidacao_ultima_inspecao['alta']}")
print(f"📈 Total de oxidação (última inspeção): {total_oxidacao_ultima_inspecao}")

# -----------------------------
# CÁLCULO DE TOTAIS PARA DASHBOARD
# -----------------------------
total_imas_trocados = df_clean["Qtd_Imas_trocados"].sum()
total_turbinas = df_clean["Turbina"].nunique()
total_carreiras = len(carreira_metrics)

# Calcular totais de criticidade
total_criticidade = sum([ciclo["Criticidade_Baixa"] + ciclo["Criticidade_Media"] + ciclo["Criticidade_Alta"] for ciclo in ciclos_data])
total_maquinas_paradas = sum([ciclo["Maquinas_Paradas"] for ciclo in ciclos_data])

# Calcular totais de oxidação
total_oxidacao_baixa = oxidacao_df["Oxidacao_Baixa"].sum()
total_oxidacao_media = oxidacao_df["Oxidacao_Media"].sum()
total_oxidacao_alta = oxidacao_df["Oxidacao_Alta"].sum()
total_oxidacao = total_oxidacao_baixa + total_oxidacao_media + total_oxidacao_alta

# >>> USAR OXIDAÇÃO DA ÚLTIMA INSPEÇÃO <<<
total_oxidacao_baixa = oxidacao_ultima_inspecao['baixa']
total_oxidacao_media = oxidacao_ultima_inspecao['media'] 
total_oxidacao_alta = oxidacao_ultima_inspecao['alta']
total_oxidacao = total_oxidacao_ultima_inspecao

print(f"/n🎯 TOTAIS ATUALIZADOS:")
print(f"   Ímãs Trocados: {total_imas_trocados}")
print(f"   Turbinas: {total_turbinas}")
print(f"   Oxidação (última inspeção): {total_oxidacao}")
print(f"   Carreiras: {total_carreiras}")

# >>> NOVO: Calcular totais de máquinas paradas <<<

if 'maquinas_paradas_json' in locals():
    total_maquinas_paradas_detalhadas = maquinas_paradas_json["resumo_por_ciclo"]["total_geral"]
else:
    total_maquinas_paradas_detalhadas = 0

# -----------------------------
# PREPARAR DADOS PARA JSON# >>> NOVO: Calcular totais de máquinas paradas <<<
if 'maquinas_paradas_json' in locals():
    total_maquinas_paradas_detalhadas = maquinas_paradas_json["resumo_por_ciclo"]["total_geral"]
else:
    total_maquinas_paradas_detalhadas = 0
    
# -----------------------------
print("/n💾 PREPARANDO DADOS PARA DASHBOARD...")

# PRIMEIRO: Preparar a estrutura oxidacao_temporal separadamente
oxidacao_temporal_json = {
    "temporal_por_mes": [
        {
            "Ciclo": row["Ciclo"],
            "Mes_Ano": row["Mes_Ano"],
            "Oxidacao_Baixa": int(row["Oxidacao_Baixa"]),
            "Oxidacao_Media": int(row["Oxidacao_Media"]),
            "Oxidacao_Alta": int(row["Oxidacao_Alta"]),
            "Total_Registros": int(row["Total_Registros"]),
            "Total_Oxidacao": int(row["Total_Oxidacao"]),
            "Percentual_Oxidacao": float(row["Percentual_Oxidacao"])
        }
        for _, row in oxidacao_temporal_df.iterrows()
    ],
    "variacao_entre_ciclos": [
        {
            "Ciclo": row["Ciclo"],
            "Oxidacao_Baixa": int(row["Oxidacao_Baixa"]),
            "Oxidacao_Media": int(row["Oxidacao_Media"]),
            "Oxidacao_Alta": int(row["Oxidacao_Alta"]),
            "Troca_Spindle": int(row.get("Troca_Spindle", 0)),
            "Total_Registros": int(row["Total_Registros"]),
            "Total_Oxidacao": int(row["Total_Oxidacao"]),
            "Percentual_Oxidacao": float(row["Percentual_Oxidacao"]),
            "Percentual_Baixa": float(row["Percentual_Baixa"]),
            "Percentual_Media": float(row["Percentual_Media"]),
            "Percentual_Alta": float(row["Percentual_Alta"])
        }
        for _, row in variacao_ciclos_df.iterrows()
    ]
}

# AGORA: Incluir oxidacao_temporal no dashboard_data
dashboard_data = {
    # >>> ESTRUTURA NOVA PARA OS GRÁFICOS <<<
    "oxidacao_temporal": oxidacao_temporal_json,
    
    # Dados Macro: Ciclos (agora com criticidade)
    "ciclos": [
        {
            "Ciclo": ciclo["Ciclo"],
            "Maquinas_Paradas": ciclo["Maquinas_Paradas"],
            "Imas_Trocados": ciclo["Imas_Trocados"],
            "Criticidade_Baixa": ciclo["Criticidade_Baixa"],
            "Criticidade_Media": ciclo["Criticidade_Media"],
            "Criticidade_Alta": ciclo["Criticidade_Alta"],
            "Dias_Parada_Medio": ciclo["Dias_Parada_Medio"]
        }
        for ciclo in ciclos_data
    ],
    
    # Dados de Oxidação: Por Ciclo (mantenha esta também se precisar)
    "oxidacao": [
        {
            "Ciclo_Inspecao": row["Ciclo_Inspecao"],
            "Oxidacao_Baixa": row["Oxidacao_Baixa"],
            "Oxidacao_Media": row["Oxidacao_Media"],
            "Oxidacao_Alta": row["Oxidacao_Alta"],
            "Total_Registros": row["Total_Registros"],
            "Total_Oxidacao": int(row["Total_Oxidacao"]),
            "Percentual_Com_Oxidacao": float(row["Percentual_Com_Oxidacao"])
        }
        for _, row in oxidacao_df.iterrows()
    ],
    
    # Dados Mésio: Turbinas
    "turbinas": [
        {
            "Turbina": row["Turbina"],
            "Total_Imas_Trocados": float(row["Total_Imas_Trocados"]),
            "Primeira_Inspecao": row["Primeira_Inspecao"].strftime("%Y-%m-%d") if pd.notna(row["Primeira_Inspecao"]) else "N/A",
            "Ultima_Inspecao": row["Ultima_Inspecao"].strftime("%Y-%m-%d") if pd.notna(row["Ultima_Inspecao"]) else "N/A",
            "Total_Inspecoes": int(row["Total_Inspecoes"]),
            "Dias_Parada_Acumulados": float(row["Dias_Parada_Acumulados"]),
            "MTBF_Dias": float(row["MTBF_Dias"]),
            "MTTR_Dias": float(row["MTTR_Dias"]),
            "Nivel_Risco": row["Nivel_Risco"]
        }
        for _, row in turbina_metrics.iterrows()
    ],
    
    # Dados Micro: Carreiras
    "carreiras": [
        {
            "Carreira": row["Carreira"],
            "Total_Imas_Trocados": float(row["Total_Imas_Trocados"]),
            "Turbinas_Afetadas": int(row["Turbinas_Afetadas"]),
            "Total_Intervencoes": int(row["Total_Intervencoes"]),
            "Media_Imas_Por_Turbina": float(row["Media_Imas_Por_Turbina"])
        }
        for _, row in carreira_metrics.iterrows()
    ],
    
    # Dados Temporais: Mensal
    "mensal": [
        {
            "Mes_Ano": row["Mes_Ano"],
            "Imas_Trocados": float(row["Imas_Trocados"]),
            "Turbinas_Unicas": int(row["Turbinas_Unicas"]),
            "Dias_Parada_Total": float(row["Dias_Parada_Total"])
        }
        for _, row in mensal_data.iterrows()
    ],
    
    # Resumo Geral
    "resumo": {
        "total_imas_trocados": float(total_imas_trocados),
        "total_turbinas": int(total_turbinas),
        "total_criticidade": int(total_criticidade),
        "total_maquinas_paradas": int(total_maquinas_paradas),
        "total_carreiras": int(total_carreiras),
        "total_oxidacao_baixa": int(total_oxidacao_baixa),
        "total_oxidacao_media": int(total_oxidacao_media),
        "total_oxidacao_alta": int(total_oxidacao_alta),
        "total_oxidacao": int(total_oxidacao),
        "periodo_analise": f"{df_clean['Data_inspecao'].min().strftime('%Y-%m')} a {df_clean['Data_inspecao'].max().strftime('%Y-%m')}",
        "data_ultima_atualizacao": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_registros": int(len(df_clean)),
        "observacao_oxidacao": "Baseado na última inspeção de cada turbina"
    }
}

# VERIFICAÇÃO ANTES DE SALVAR
print(f"/n🔍 VERIFICAÇÃO DA ESTRUTURA oxidacao_temporal:")
print(f"   - temporal_por_mes: {len(oxidacao_temporal_json['temporal_por_mes'])} registros")
print(f"   - variacao_entre_ciclos: {len(oxidacao_temporal_json['variacao_entre_ciclos'])} ciclos")

# -----------------------------
# SALVAR ARQUIVOS
# -----------------------------
assets_path = r"C:/Users/de.ferreira/OneDrive - VOLTALIA/09 - Arquivos WEG/11 - Analises SCADA/Projetos Imas e Callipers/dashboard-imas-eolicos_planilha_nova/src/assets"

try:
    if not os.path.exists(assets_path):
        os.makedirs(assets_path)
        print(f"📁 Diretório criado: {assets_path}")
    
    json_path = os.path.join(assets_path, "dashboard_data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(dashboard_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ dashboard_data.json salvo com sucesso em: {json_path}")
    
    # VERIFICAÇÃO FINAL
    print(f"/n📋 ESTRUTURA FINAL DO JSON:")
    print(f"   - oxidacao_temporal: ✅ PRESENTE")
    print(f"   - ciclos: {len(dashboard_data['ciclos'])} ciclos")
    print(f"   - turbinas: {len(dashboard_data['turbinas'])} turbinas")
    print(f"   - carreiras: {len(dashboard_data['carreiras'])} carreiras")
    
except Exception as e:
    print(f"❌ Erro ao salvar arquivo: {e}")
    current_dir = os.getcwd()
    backup_path = os.path.join(current_dir, "dashboard_data.json")
    with open(backup_path, "w", encoding="utf-8") as f:
        json.dump(dashboard_data, f, ensure_ascii=False, indent=2)
    print(f"✅ Arquivo salvo em backup: {backup_path}")

# -----------------------------
# RELATÓRIO FINAL
# -----------------------------
print("/n" + "="*60)
print("🎉 ANÁLISE CONCLUÍDA COM SUCESSO!")
print("="*60)
print(f"📊 Total de registros processados: {len(df_clean)}")
print(f"🌀 Total de turbinas analisadas: {total_turbinas}")
print(f"🧲 Total de ímãs trocados: {total_imas_trocados:.0f}")
print(f"🔬 Dados para gráficos de oxidação:")
print(f"   - Evolução Temporal: {len(oxidacao_temporal_json['temporal_por_mes'])} registros mensais")
print(f"   - Comparação entre Ciclos: {len(oxidacao_temporal_json['variacao_entre_ciclos'])} ciclos")
print("="*60)