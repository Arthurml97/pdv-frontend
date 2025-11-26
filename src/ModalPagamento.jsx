import { useState, useEffect } from 'react'

function ModalPagamento({ total, onConfirmar, onCancelar }) {
    const [metodo, setMetodo] = useState('DINHEIRO')
    const [valorDigitado, setValorDigitado] = useState('')

    // Controle de Pagamentos Parciais
    const [pagamentos, setPagamentos] = useState([])
    const [restante, setRestante] = useState(total)
    const [troco, setTroco] = useState(0)

    // Calcula troco ou restante em tempo real
    useEffect(() => {
        // Se já pagou tudo, não precisa calcular mais nada
        if (restante <= 0) return

        const valor = parseFloat(valorDigitado.replace(',', '.')) || 0

        // Se for Dinheiro e cobrir tudo, mostra troco
        if (metodo === 'DINHEIRO' && valor > restante) {
            setTroco(valor - restante)
        } else {
            setTroco(0)
        }
    }, [valorDigitado, metodo, restante])

    const adicionarPagamento = () => {
        const valor = parseFloat(valorDigitado.replace(',', '.'))
        if (!valor || valor <= 0) return

        // REGRA 1: Cartão não pode ser maior que o restante
        if (metodo === 'CARTAO' && valor > restante) {
            alert(`❌ Erro: No cartão você só pode passar até R$ ${restante.toFixed(2)}`)
            return
        }

        // Se for dinheiro e pagou a mais, consideramos que pagou o restante e gerou troco
        let valorRealPago = valor
        if (metodo === 'DINHEIRO' && valor > restante) {
            valorRealPago = restante // Só abate o que faltava
            // O troco já está calculado no state 'troco' visualmente
        }

        const novosPagamentos = [...pagamentos, { metodo, valor: valorRealPago }]
        setPagamentos(novosPagamentos)

        // Atualiza o que falta
        const novoRestante = restante - valorRealPago
        setRestante(novoRestante < 0 ? 0 : novoRestante)

        // Limpa campo
        setValorDigitado('')

        // Se zerou a conta, finaliza automaticamente (simulando delay pra ver o resultado)
        if (novoRestante <= 0.01) {
            setTimeout(() => {
                onConfirmar({
                    pagamentos: novosPagamentos,
                    troco: troco
                })
            }, 500)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') adicionarPagamento()
        if (e.key === 'Escape') onCancelar()
    }

    return (
        <div style={styles.overlay} onKeyDown={handleKeyDown}>
            <div style={styles.modal}>
                <h2 style={{ margin: 0, color: '#fff', marginBottom: '20px' }}>💸 Pagamento</h2>

                {/* RESUMO DO QUE FALTA */}
                <div style={styles.totalDisplay}>
                    {restante > 0 ? (
                        <>
                            <small style={{ fontSize: '1rem', color: '#aaa' }}>FALTA PAGAR</small>
                            <div style={{ color: '#e74c3c' }}>R$ {restante.toFixed(2)}</div>
                        </>
                    ) : (
                        <div style={{ color: '#2ecc71' }}>TUDO PAGO! ✅</div>
                    )}
                </div>

                {/* LISTA DE PAGAMENTOS JÁ FEITOS (HISTÓRICO) */}
                <div style={styles.listaPagamentos}>
                    {pagamentos.map((p, i) => (
                        <div key={i} style={styles.itemPagamento}>
                            <span>{p.metodo === 'DINHEIRO' ? '💵' : '💳'}</span>
                            <span>R$ {p.valor.toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                {restante > 0 && (
                    <>
                        {/* SELETOR DE MÉTODO */}
                        <div style={styles.opcoes}>
                            <button
                                onClick={() => setMetodo('DINHEIRO')}
                                style={metodo === 'DINHEIRO' ? styles.btnDinheiroAtivo : styles.btnInativo}>
                                💵 DINHEIRO
                            </button>
                            <button
                                onClick={() => setMetodo('CARTAO')}
                                style={metodo === 'CARTAO' ? styles.btnCartaoAtivo : styles.btnInativo}>
                                💳 CARTÃO
                            </button>
                        </div>

                        {/* CAMPO DE VALOR */}
                        <div style={styles.areaInput}>
                            <label>Valor a lançar (R$)</label>
                            <input
                                autoFocus
                                type="number"
                                style={styles.input}
                                value={valorDigitado}
                                // Sugere o valor restante automaticamente
                                placeholder={restante.toFixed(2)}
                                onChange={e => setValorDigitado(e.target.value)}
                            />

                            {metodo === 'DINHEIRO' && troco > 0 && (
                                <div style={styles.trocoPositivo}>
                                    TROCO: R$ {troco.toFixed(2)}
                                </div>
                            )}
                        </div>

                        <div style={styles.actions}>
                            <button onClick={onCancelar} style={styles.btnCancelar}>CANCELAR</button>
                            <button onClick={adicionarPagamento} style={styles.btnConfirmar}>
                                {restante > 0 ? 'LANÇAR PAGAMENTO (ENTER)' : 'CONCLUIR'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '15px', width: '450px', textAlign: 'center', border: '1px solid #333' },

    totalDisplay: { backgroundColor: '#333', padding: '15px', borderRadius: '10px', marginBottom: '15px', fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1 },

    listaPagamentos: { marginBottom: '20px', maxHeight: '100px', overflowY: 'auto' },
    itemPagamento: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #333', fontSize: '1.2rem', color: '#aaa' },

    opcoes: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' },
    btnDinheiroAtivo: { padding: '15px', border: '2px solid #2ecc71', backgroundColor: '#2ecc71', color: '#121212', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', transform: 'scale(1.02)' },
    btnCartaoAtivo: { padding: '15px', border: '2px solid #3498db', backgroundColor: '#3498db', color: '#121212', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', transform: 'scale(1.02)' },
    btnInativo: { padding: '15px', border: '2px solid #444', backgroundColor: 'transparent', color: '#666', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' },

    areaInput: { display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', marginBottom: '20px' },
    input: { padding: '15px', fontSize: '2rem', borderRadius: '8px', border: '1px solid #555', backgroundColor: '#222', color: 'white', textAlign: 'center' },
    trocoPositivo: { fontSize: '1.5rem', color: '#2ecc71', fontWeight: 'bold', marginTop: '5px', textAlign: 'center' },

    actions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    btnCancelar: { padding: '20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
    btnConfirmar: { padding: '20px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
}

export default ModalPagamento