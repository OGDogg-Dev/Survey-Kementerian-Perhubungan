<?php

namespace App\Mail;

use App\Models\SurveyResponse;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SurveyResponseNotification extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(public SurveyResponse $response)
    {
    }

    /**
     * Build the message.
     */
    public function build(): static
    {
        $survey = $this->response->survey;

        return $this->subject('New survey response')
            ->view('emails.survey-response', [
                'survey' => $survey,
                'response' => $this->response,
            ]);
    }
}
