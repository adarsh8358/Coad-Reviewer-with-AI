import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io as SocketIo } from "socket.io-client";
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
    const prams = useParams();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [socket, setSocket] = useState(null);
    const [code, setCode] = useState("// Write your code here\n");
    const [language, setLanguage] = useState("javascript");
    const [review, setReview] = useState("");

    function handleUserMessage() {
        setMessages((prev) => {
            return [...prev, input];
        });
        socket.emit("chat-message", input);
        setInput("");
    }

    function getReview() {
        socket.emit("get-review", code);
    }

    useEffect(() => {
        const io = SocketIo("http://localhost:3000", {
            query: {
                project: prams.id
            }
        });

        io.emit("chat-history");

        io.on('chat-history', (messages) => {
            setMessages(messages.map((message) => message.text));
        });

        io.on('chat-message', (message) => {
            setMessages((prev) => {
                return [...prev, message];
            });
        });

        io.on('code-change', (code) => {
            setCode(code);
        });

        io.on('project-code', (code) => {
            setCode(code);
        });

        io.on("code-review", (review) => {
            console.log(review);
            setReview(review);
        });

        io.emit("get-project-code");

        setMessages([]);
        setSocket(io);
    }, []);

    return (
        <main className='project-main'>
            <section className='project-section'>
                <div className="chat">

                    <div className="messages">
                        {
                            messages.map((message, index) => {
                                return (<div className='message' key={index}>
                                    <span>
                                        {message}
                                    </span>
                                </div>);
                            })
                        }
                    </div>

                    <div className="input-area">
                        <input
                            type="text"
                            placeholder='message to project...'
                            onChange={(e) => {
                                setInput(e.target.value);
                            }}
                            value={input}
                        />
                        <button
                            onClick={() => { handleUserMessage(); }}
                        ><i className="ri-send-plane-2-fill"></i></button>
                    </div>

                </div>
                <div className="code" style={{ position: 'relative' }}>
                    <Select
                        options={languageOptions}
                        onChange={(selectedOption) => setLanguage(selectedOption.value)}
                        placeholder="Select Language"
                        className="language-select"
                    />
                    <Editor
                        height="400px"
                        language={language}
                        value={code}
                        theme="vs-dark"
                        onChange={(value) => {
                            setCode(value);
                            socket.emit("code-change", value);
                        }}
                    />
                </div>
                <div className="review">
                    <button
                        onClick={() => {
                            getReview();
                        }}
                        className='get-review'>
                        Get-Review
                    </button>
                    <div className="review-content">
                        {review ? <ReactMarkdown>{review}</ReactMarkdown> : <p style={{ textAlign: 'center', fontWeight: 'bold' }}>No review yet. Click 'Get-Review' to generate a code review.</p>}
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Project;