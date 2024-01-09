interface ArchiveOptions {
    capture_all?: boolean;
    capture_outlinks?: boolean;
    capture_screenshot?: boolean;
    delay_wb_availability?: boolean;
    skip_first_archive?: boolean;
}

const defaultOptions: ArchiveOptions = {
    delay_wb_availability: true,
    skip_first_archive: true
}

interface ArchiveResponse {
    url: string;
    job_id: string;
}

type CommonFields = {
    job_id: string;
    resources?: string[];
};

type SuccessResponse = CommonFields & {
    status: 'success';
    original_url: string;
    screenshot?: string;
    timestamp: string;
    duration_sec: number;
    outlinks?: Record<string, string>;
};

type PendingResponse = CommonFields & {
    status: 'pending';
};

type ErrorResponse = CommonFields & {
    status: 'error';
    exception?: string;
    status_ext?: string;
    message?: string;
};

type StatusResponse = SuccessResponse | PendingResponse | ErrorResponse;

class ArchiveAPI {
    accessKey: string;
    secret: string;

    constructor(accessKey: string, secret: string) {
        this.accessKey = accessKey;
        this.secret = secret;
    }

    private buildPostData(options: ArchiveOptions): URLSearchParams {
        Object.keys(defaultOptions).forEach(key => {
            if (options[key] === undefined) {
                options[key] = defaultOptions[key];
            }
        });

        let data = new URLSearchParams();
        for (let [key, value] of Object.entries(options)) {
            data.set(key, value ? '1' : '0');
        }
        return data;
    }

    public async saveUrl(url: string, options: ArchiveOptions = {}): Promise<ArchiveResponse> {
        const data = this.buildPostData(options);
        data.set('url', url);

        const response = await fetch('https://web.archive.org/save', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `LOW ${this.accessKey}:${this.secret}`,
            },
            body: data,
        });

        return await response.json();
    }

    public async getStatus(job_id: string): Promise<StatusResponse> {
        const response = await fetch(`https://web.archive.org/save/status/${job_id}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `LOW ${this.accessKey}:${this.secret}`,
            },
        });

        return await response.json();
    }
}

export { ArchiveAPI };