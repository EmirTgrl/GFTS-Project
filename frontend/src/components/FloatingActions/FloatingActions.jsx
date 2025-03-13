import { PlusLg, Pencil, List, Trash } from 'react-bootstrap-icons';
import '../../styles/FloatingActions.css';
import React, { useState } from 'react';

const FloatingActions = () => {
    return (
        <div className="floating-actions">
            <div className="secondary-actions">
                <button className="fab-secondary">
                    <Trash size={20} />
                </button>
                <button className="fab-secondary">
                    <Pencil size={20} />
                </button>
                <button className="fab-secondary">
                    <PlusLg size={20} />
                </button>
            </div>
            <div className="main-action">
                <button className="fab-main">
                    <List size={24} />
                </button>
            </div>
        </div>
    );

};

export default FloatingActions;