import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io as SocketIo } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import Select from 'react-select';
import ReactMarkdown from 'react-markdown';
import './Project.css';

const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'go', label: 'Go' },
    { value: 'swift', label: 'Swift' },
];

const Project = () => {
    const params = useParams();
    const socketRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [code, setCode] = useState('// Write your code here\n');
    const [language, setLanguage] = useState('javascript');
    const [review, setReview] = useState('');
    const [connected, setConnected] = useState(false);
    const [loadingReview, setLoadingReview] = useState(false);

    // helper to safely emit
    const safeEmit = (event, payload) => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit(event, payload);
        }
    };

    function handleUserMessage() {
        const trimmed = input.trim();
        if (!trimmed) return;
        // Append locally for snappy UI optim.
        setMessages(prev => [...prev, { from: 'you', text: trimmed }]);
        safeEmit('chat-message', trimmed);
        setInput('');
    }

    function getReview() {
        if (!connected) return;
        setLoadingReview(true);
        safeEmit('get-review', code);
    }

    useEffect(() => {
        // connect once
        const io = SocketIo('http://localhost:3000', {
            query: { project: params.id },
            transports: ['websocket'],
        });

        socketRef.current = io;

        io.on('connect', () => {
            setConnected(true);
            // request history + project code once connected
            io.emit('chat-history');
            io.emit('get-project-code');
        });

        io.on('disconnect', () => {
            setConnected(false);
            setLoadingReview(false);
        });

        io.on('chat-history', msgs => {
            // Expecting msgs like [{ text, from, ... }]
            setMessages(Array.isArray(msgs) ? msgs.map(m => ({ from: m.from || 'server', text: m.text })) : []);
        });

        io.on('chat-message', message => {
            // message could be string or object
            if (typeof message === 'string') {
                setMessages(prev => [...prev, { from: 'server', text: message }]);
            } else {
                setMessages(prev => [...prev, { from: message.from || 'server', text: message.text }]);
            }
        });

        io.on('code-change', newCode => {
            // update editor when remote changes (avoid echo if you want)
            setCode(prev => (prev === newCode ? prev : newCode));
        });

        io.on('project-code', initialCode => {
            if (initialCode) setCode(initialCode);
        });

        io.on('code-review', reviewText => {
            setReview(reviewText || '');
            setLoadingReview(false);
        });

        // cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    // keyboard send (Enter)
    const handleKeyDown = e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserMessage();
        }
    };

    // find Select value object for controlled Select component
    const selectedLangOption = languageOptions.find(opt => opt.value === language) || languageOptions[0];

    return (
        <main className="project-main">
            <section className="project-section">
                {/* CHAT PANEL */}
                <div className="chat" aria-live="polite">
                    <div className="chat-header">
                        <h3>Project Chat</h3>
                        <div className={`status ${connected ? 'online' : 'offline'}`}>{connected ? 'Live' : 'Offline'}</div>
                    </div>

                    <div className="messages" role="log" aria-label="chat messages">
                        {messages.length === 0 ? (
                            <div className="empty-chat">No messages yet. Say hi 👋</div>
                        ) : (
                            messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`message ${message.from === 'you' ? 'mine' : 'theirs'}`}
                                    title={message.from}
                                >
                                    <span>{message.text}</span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="input-area">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Message to project..."
                            onKeyDown={handleKeyDown}
                            aria-label="Type a message"
                        />
                        <button
                            onClick={handleUserMessage}
                            aria-label="Send message"
                            className="send-btn"
                            disabled={!connected && input.trim().length === 0}
                        >
                            <i className="ri-send-plane-2-fill" />
                        </button>
                    </div>
                </div>

                {/* CODE EDITOR PANEL */}
                <div className="code">
                    <div className="code-toolbar">
                        <div className="select-wrap">
                            <Select
                                options={languageOptions}
                                value={selectedLangOption}
                                onChange={opt => setLanguage(opt.value)}
                                classNamePrefix="react-select"
                                isSearchable
                                aria-label="Select language"
                            />
                        </div>

                        <div className="editor-actions">
                            <button
                                className="btn-outline"
                                onClick={() => safeEmit('save-project-code', code)}
                                title="Save code"
                            >
                                Save
                            </button>
                        </div>
                    </div>

                    <Editor
                        height="100%"
                        language={language}
                        value={code}
                        theme="vs-dark"
                        onChange={value => {
                            setCode(value || '');
                            safeEmit('code-change', value || '');
                        }}
                        options={{
                            fontSize: 14,
                            minimap: { enabled: false },
                            automaticLayout: true,
                        }}
                    />
                </div>

                {/* REVIEW PANEL */}
                <div className="review">
                    <div className="review-header">
                        <h3>Code Review</h3>
                        <button
                            className="get-review"
                            onClick={getReview}
                            disabled={loadingReview || !connected}
                            aria-busy={loadingReview}
                        >
                            {loadingReview ? 'Loading…' : 'Get Review'}
                        </button>
                    </div>

                    <div className="review-content" role="region" aria-label="code review">

                        {loadingReview ? (
                            <p className="no-review loading">Generating review…</p>
                        ) : review ? (
                            <ReactMarkdown>{review}</ReactMarkdown>
                        ) : (
                            <p className="no-review">No review yet. Click &quot;Get Review&quot; to generate one.</p>
                        )}

                    </div>
                </div>
            </section>
        </main>
    );
};

export default Project;