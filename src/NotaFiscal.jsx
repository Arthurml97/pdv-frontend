import { useState, useEffect } from 'react'
import axios from 'axios'

function NotaFiscal({ idVenda, onNovaVenda }) {
    const [nota, setNota] = useState(null)

    useEffect(() => {
        axios.get(`http://localhost:8080/api/fiscal/${idVenda}`)
            .then(res => setNota(res.data))
            .catch(err => console.error("Erro ao buscar a nota:", err))
    }, [idVenda])

    if (!nota) return <div style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>Gerando Nota Fiscal...</div>

    return (
        <div className="overlay-nota">
            {/* CSS ESPECÍFICO PARA IMPRESSÃO CORRETA */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .papel-termico, .papel-termico * { visibility: visible; }
                    .papel-termico { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        margin: 0; 
                        padding: 0;
                        box-shadow: none;
                        max-height: none; 
                        overflow: visible;
                    }
                    .no-print { display: none !important; }
                    .overlay-nota { position: static; background: white; }
                }
            `}</style>

            <div className="papel-termico" style={styles.papelTermico}>
                {/*CABEÇALHO*/}
                <div style={styles.centro}>
                    <h2 style={{ margin: 0 }}>{nota.nomeLoja}</h2>
                    <small>CNPJ: {nota.cnpj}</small><br />
                    <small>{nota.dataHora}</small>
                    <hr style={styles.divisoria} />
                    <strong>EXTRATO N° {nota.numeroVenda}</strong><br />
                    <span>CUPOM FISCAL ELETRÔNICO</span>
                </div>

                <hr style={styles.divisoria} />

                {/* LISTA DE ITENS */}
                <table style={styles.tabela}>
                    <thead>
                        <tr>
                            <th style={styles.colEsq}>ITEM</th>
                            <th style={styles.colDir}>TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {nota.itens && nota.itens.map((item, i) => (
                            <tr key={i}>
                                <td style={styles.colEsq}>
                                    {item.quantidade}x {item.produto}<br />
                                    <small>({(item.preço || 0).toFixed(2)})</small>
                                </td>
                                <td style={styles.colDir}>
                                    {(item.total || 0).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <hr style={styles.divisoria} />

                {/* TOTAIS */}
                <div style={styles.linhaTotal}>
                    <span>TOTAL R$</span>
                    <span style={{ fontSize: '1.2rem' }}>{(nota.valorTotal || 0).toFixed(2)}</span>
                </div>

                {/* PAGAMENTOS (Se o Java mandar no futuro, já aparece aqui) */}
                {nota.pagamentos && (
                    <div style={{ marginTop: 10 }}>
                        {nota.pagamentos.map((pag, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span>{pag.metodo}</span>
                                <span>{pag.valor.toFixed(2)}</span>
                            </div>
                        ))}
                        {/* Se não tiver detalhe, mostra genérico */}
                    </div>
                )}

                <div style={styles.centro}>
                    <small>Val aprox Tributos: R$ {(nota.impostosEstimados || 0).toFixed(2)} (30%)</small>
                </div>

                <hr style={styles.divisoria} />

                {/* RODAPÉ E CHAVE */}
                <div style={styles.centro}>
                    <span>CONSUMIDOR: {nota.nomeCliente || "NÃO IDENTIFICADO"}</span><br />
                    <span>CPF: {nota.cpfCliente || "---"}</span>
                    <br /><br />
                    <strong>CHAVE DE ACESSO: </strong><br />
                    <small style={{ wordBreak: 'break-all' }}>{nota.chaveAcessoFake}</small>
                    <br /><br />
                    <div style={styles.barcode}>|||||| || |||||||| |||| |||||</div>
                </div>

                {/*BOTOES DE AÇÃO (Classe no-print esconde na impressão) */}
                <div className="no-print" style={styles.areaBotoes}>
                    <button onClick={() => window.print()} style={styles.btnImprimir}>🖨️ IMPRIMIR</button>
                    <button onClick={onNovaVenda} style={styles.btnNovo}>🛒 PRÓXIMO CLIENTE</button>
                </div>

            </div>
        </div>
    )
}

const styles = {
    papelTermico: {
        backgroundColor: '#fffbe6',
        color: '#000',
        fontFamily: '"Courier New", Courier, monospace',
        width: '350px',
        padding: '20px',
        borderRadius: '5px',
        boxShadow: '0 0 20px rgba(255,255,255,0.2)',
        maxHeight: '90vh',
        overflowY: 'auto',
        margin: '0 auto', // Centraliza
        marginTop: '20px'
    },
    centro: { textAlign: 'center', marginBottom: '10px' },
    divisoria: { border: '1px dashed #000', margin: '10px 0' },
    tabela: { width: '100%', fontSize: '0.9rem' },
    colEsq: { textAlign: 'left', verticalAlign: 'top' },
    colDir: { textAlign: 'right', verticalAlign: 'top' },
    linhaTotal: { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', margin: '10px 0' },
    barcode: { fontFamily: 'fantasy', fontSize: '2rem', letterSpacing: '-2px' },
    areaBotoes: { marginTop: '20px', display: 'flex', gap: '10px' },
    btnImprimir: { flex: 1, padding: '10px', backgroundColor: '#95a5a6', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
    btnNovo: { flex: 1, padding: '10px', backgroundColor: '#2ecc71', border: 'none', cursor: 'pointer', fontWeight: 'bold' }
}

export default NotaFiscal