resource "random_id" "default" {
  byte_length = 4
  keepers = {
    name : var.name,
    project_name : var.project_name
  }
}

resource "aws_cloudfront_distribution" "my_distribution" {
  origin {
    domain_name = var.regional_domain_name
    origin_id   = var.bucket_id
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.my_oai.cloudfront_access_identity_path
    }
  }

  enabled = true

  default_cache_behavior {
    target_origin_id       = var.bucket_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]
    compress = true


    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}

resource "aws_cloudfront_origin_access_identity" "my_oai" {
  comment = "OAI for my CloudFront Distribution"
}

/* Bucket permission */
data "aws_iam_policy_document" "bucket_read_only" {
  statement {
    actions   = ["s3:GetObject", "s3:ListBucket"]
    resources = ["${var.bucket_arn}", "${var.bucket_arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.my_oai.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "default" {
  bucket = var.bucket_id
  policy = data.aws_iam_policy_document.bucket_read_only.json
}