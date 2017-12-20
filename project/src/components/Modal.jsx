import React from 'react';
import {Modal, Button} from 'react-bootstrap';

/**
 * Modal component that is used for all dialogs and the graph
 */
export default function Portfolio(props) {

    const {title, children, closeButtonClick, actionButtonClick, id, disableSave, buttonOKText, buttonCancelText, size} = props;
    return (
        <Modal.Dialog bsSize={size}>
            <Modal.Header>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {children}
            </Modal.Body>

            <Modal.Footer>
                {buttonCancelText && <Button onClick={() => closeButtonClick(id)}>{buttonCancelText}</Button>}
                {buttonOKText && <Button bsStyle="primary" disabled={disableSave}
                                         onClick={() => actionButtonClick(id)}>{buttonOKText}</Button>}
            </Modal.Footer>

        </Modal.Dialog>
    );
}
