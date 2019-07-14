/**
 * An expected callback, including the name and function to execute.
 */
interface ExpectedCallback {
    /**
     * The name of the callback handler. For instance, onText
     */
    name: string;

    /**
     * The function to attach to the given callback.
     */
    onCall?: (...args: any[]) => any;
}

export = ExpectedCallback;
